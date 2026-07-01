// Cloudflare Pages Function — recebe o cadastro, gera a aula (OpenAI),
// o áudio (ElevenLabs) e grava no Supabase. Chaves ficam em variáveis de ambiente.
const VOICE = "Xb7hH8MSUJpSbSDYk0k2"; // Alice (ElevenLabs)

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseJson(s) {
  if (!s) throw new Error("a IA não retornou conteúdo");
  let t = String(s).trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

function construirNarracao(blocos) {
  const p = [];
  for (const b of (blocos || [])) for (const a of (b.aulas || [])) {
    if (a.frase) p.push(a.frase);
    if (Array.isArray(a.conceitos)) p.push(a.conceitos.join(". "));
  }
  return p.join(". ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 2500);
}

const SYS_PROMPT = `Você é um professor que cria materiais de estudo para provas de qualquer matéria. A partir do CONTEÚDO fornecido, gere SOMENTE um JSON válido (sem texto fora do JSON), neste formato exato:
{
  "emoji": "emoji do tema",
  "narracao": "texto corrido em português do Brasil, de 1500 a 2500 caracteres, explicando o assunto de forma didática para ser OUVIDO como um áudio-resumo. Sem markdown, sem listas, sem símbolos (escreva 'maior ou igual a 126' por extenso).",
  "blocos": [
    { "nome": "emoji + nome curto do bloco/matéria", "aulas": [
      { "num": "1", "titulo": "título do tópico",
        "frase": "a ÚNICA frase-chave que faz o resto fazer sentido",
        "analogia": "uma analogia simples do dia a dia",
        "conceitos": ["bullet curto","bullet curto"],
        "dados_label": "📌 Números que caem na prova",
        "dados": [["TAG","informação com número/valor exato"]],
        "flash": [["pergunta de teste","resposta"]]
      }
    ]}
  ]
}
Regras: escreva em PORTUGUÊS DO BRASIL com acentuação correta (ã, ç, é, í, ó). Gere de 3 a 6 tópicos no total, cobrindo bem o conteúdo. Cada "conceito" deve ser uma frase completa e explicativa (NÃO palavras soltas). Sempre preencha "analogia". Use 3 a 5 conceitos, 2 a 4 itens em "dados" (com números/valores literais quando houver) e 3 a 5 flashcards por aula. Seja exato com números, leis, doses e classificações. Responda APENAS com o JSON.`;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { titulo, materias, data_prova, formato, tema, texto } = body;
    if (!titulo || !data_prova || !texto || texto.trim().length < 30) {
      return json({ error: "Preencha o nome, a data e anexe um PDF com conteúdo legível." }, 400);
    }

    // 1) IA gratuita do Cloudflare (Workers AI - Llama 3.3) gera a estrutura
    if (!env.AI) return json({ error: "IA (Workers AI) não está configurada no projeto." }, 500);
    let dados;
    try {
      const ai = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: SYS_PROMPT },
          { role: "user", content: `PROVA: ${titulo}\nFORMATO: ${formato || ""}\n\nCONTEÚDO EXTRAÍDO DOS ARQUIVOS:\n${String(texto).slice(0, 24000)}` },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      });
      const raw = ai && ai.response;
      if (raw && typeof raw === "object") dados = raw;
      else dados = parseJson(raw || "");
    } catch (e) {
      return json({ error: "Falha na IA: " + String(e).slice(0, 300) }, 502);
    }
    if (!dados || !Array.isArray(dados.blocos)) {
      return json({ error: "A IA não retornou a estrutura esperada. Tente novamente." }, 502);
    }

    const SB = env.SB_URL;
    const SK = env.SB_SERVICE_KEY;
    const sbH = { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" };

    // 2) cria a prova
    const pr = await fetch(SB + "/rest/v1/provas", {
      method: "POST",
      headers: { ...sbH, Prefer: "return=representation" },
      body: JSON.stringify({
        titulo, emoji: dados.emoji || "📚", materias: materias || "",
        data_prova, formato: formato || null, tema: tema || "rosa", ordem: 0,
      }),
    });
    if (!pr.ok) return json({ error: "Falha ao salvar a prova: " + (await pr.text()).slice(0, 300) }, 502);
    const provaId = (await pr.json())[0].id;

    // 3) áudio-resumo (ElevenLabs) → Storage do Supabase
    let audioUrl = null, audioErr = null;
    const narr = dados.narracao || construirNarracao(dados.blocos);
    if (narr && narr.length > 40 && env.ELEVEN_KEY) {
      try {
        const el = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + VOICE + "?output_format=mp3_44100_128", {
          method: "POST",
          headers: { "xi-api-key": env.ELEVEN_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({ text: narr, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true } }),
        });
        if (el.ok) {
          const audio = await el.arrayBuffer();
          const fname = "prova_" + provaId + ".mp3";
          const up = await fetch(SB + "/storage/v1/object/audios/" + fname, {
            method: "POST",
            headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "audio/mpeg", "x-upsert": "true" },
            body: audio,
          });
          if (up.ok) audioUrl = SB + "/storage/v1/object/public/audios/" + fname;
          else audioErr = "upload " + up.status + " " + (await up.text()).slice(0, 160);
        } else {
          audioErr = "eleven " + el.status + " " + (await el.text()).slice(0, 160);
        }
      } catch (e) { audioErr = String(e).slice(0, 160); }
    } else {
      audioErr = "sem narração (" + (narr ? narr.length : 0) + " chars)";
    }

    // 4) monta e insere os tópicos
    const topicos = [];
    let bO = 0;
    for (const b of (dados.blocos || [])) {
      let tO = 0;
      for (const a of (b.aulas || [])) {
        topicos.push({
          prova_id: provaId, bloco: b.nome || "Geral", ordem: bO * 100 + tO++,
          num: String(a.num || "•"), titulo: a.titulo || "Tópico",
          frase: a.frase || null, analogia: a.analogia || null,
          conceitos: a.conceitos || [], passos: a.passos || [],
          dados: a.dados || [], dados_label: a.dados_label || null,
          flash: a.flash || [], audio_url: null,
        });
      }
      bO++;
    }
    if (topicos.length && audioUrl) topicos[0].audio_url = audioUrl;
    if (topicos.length) {
      const tp = await fetch(SB + "/rest/v1/topicos", {
        method: "POST", headers: { ...sbH, Prefer: "return=minimal" },
        body: JSON.stringify(topicos),
      });
      if (!tp.ok) return json({ error: "Falha ao salvar os tópicos: " + (await tp.text()).slice(0, 300) }, 502);
    }

    return json({ ok: true, prova_id: provaId, topicos: topicos.length, audio: !!audioUrl, audio_err: audioErr });
  } catch (e) {
    return json({ error: "Erro inesperado: " + String(e).slice(0, 300) }, 500);
  }
}
