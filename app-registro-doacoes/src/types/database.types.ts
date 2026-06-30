/**
 * Tipos do schema `public` do Supabase (escritos à mão; refletem as migrations).
 * Regenerar após mudanças:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StatusDoacao = "pendente_lancamento" | "lancado";
export type Recorrencia = "sob_demanda" | "recorrente";
export type TipoDocumento = "comprovante" | "nota_fiscal" | "termo" | "outro";
export type PerfilUsuario = "captacao" | "fiscal" | "admin";

export interface Database {
  public: {
    Tables: {
      perfis_usuario: {
        Row: {
          user_id: string;
          nome: string | null;
          email: string | null;
          perfil: PerfilUsuario;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          user_id: string;
          nome?: string | null;
          email?: string | null;
          perfil: PerfilUsuario;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["perfis_usuario"]["Insert"]>;
        Relationships: [];
      };
      ref_classificacao: {
        Row: { codigo: string; rotulo: string; ativo: boolean; ordem: number };
        Insert: { codigo: string; rotulo: string; ativo?: boolean; ordem?: number };
        Update: Partial<Database["public"]["Tables"]["ref_classificacao"]["Insert"]>;
        Relationships: [];
      };
      transicoes_validas: {
        Row: { status_de: StatusDoacao; status_para: StatusDoacao };
        Insert: { status_de: StatusDoacao; status_para: StatusDoacao };
        Update: Partial<{ status_de: StatusDoacao; status_para: StatusDoacao }>;
        Relationships: [];
      };
      doacoes: {
        Row: {
          id: string;
          classificacao: string;
          recorrencia: Recorrencia;
          doador_nome: string;
          doador_documento: string | null;
          captador_responsavel: string | null;
          documento_fiscal_numero: string | null;
          data_doacao: string;
          empresa: string;
          estoque: boolean;
          observacoes: string | null;
          valor: number;
          quantidade_itens: number;
          status: StatusDoacao;
          codigo_fornecedor: string | null;
          natureza_contabil: string | null;
          nr_lancamento_erp: string | null;
          data_lancamento_erp: string | null;
          usuario_lancamento_erp: string | null;
          notificado: boolean;
          notificado_em: string | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          classificacao: string;
          recorrencia?: Recorrencia;
          doador_nome: string;
          doador_documento?: string | null;
          captador_responsavel?: string | null;
          documento_fiscal_numero?: string | null;
          data_doacao?: string;
          empresa: string;
          estoque: boolean;
          observacoes?: string | null;
          valor?: number;
          quantidade_itens?: number;
          status?: StatusDoacao;
          codigo_fornecedor?: string | null;
          natureza_contabil?: string | null;
          nr_lancamento_erp?: string | null;
          data_lancamento_erp?: string | null;
          usuario_lancamento_erp?: string | null;
          notificado?: boolean;
          notificado_em?: string | null;
          criado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doacoes"]["Insert"]>;
        Relationships: [];
      };
      doacao_itens: {
        Row: {
          id: string;
          doacao_id: string;
          ordem: number;
          descricao: string;
          quantidade: number;
          valor_unitario: number;
          valor_total: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          doacao_id: string;
          ordem?: number;
          descricao: string;
          quantidade?: number;
          valor_unitario?: number;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doacao_itens"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "doacao_itens_doacao_id_fkey";
            columns: ["doacao_id"];
            referencedRelation: "doacoes";
            referencedColumns: ["id"];
          }
        ];
      };
      doacao_documentos: {
        Row: {
          id: string;
          doacao_id: string;
          tipo_documento: TipoDocumento;
          storage_path: string;
          nome_original: string | null;
          tamanho_bytes: number | null;
          mime_type: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          doacao_id: string;
          tipo_documento: TipoDocumento;
          storage_path: string;
          nome_original?: string | null;
          tamanho_bytes?: number | null;
          mime_type?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doacao_documentos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "doacao_documentos_doacao_id_fkey";
            columns: ["doacao_id"];
            referencedRelation: "doacoes";
            referencedColumns: ["id"];
          }
        ];
      };
      doacao_log: {
        Row: {
          id: number;
          doacao_id: string;
          usuario: string | null;
          acao: string;
          status_anterior: StatusDoacao | null;
          status_novo: StatusDoacao | null;
          detalhe: Json;
          criado_em: string;
        };
        Insert: {
          id?: number;
          doacao_id: string;
          usuario?: string | null;
          acao: string;
          status_anterior?: StatusDoacao | null;
          status_novo?: StatusDoacao | null;
          detalhe?: Json;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doacao_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      tem_perfil: { Args: { p_perfis: string[] }; Returns: boolean };
      meu_perfil: { Args: Record<string, never>; Returns: string };
      transicao_valida: { Args: { p_de: string; p_para: string }; Returns: boolean };
      transicionar_status: {
        Args: { p_doacao_id: string; p_novo_status: string; p_usuario?: string; p_detalhe?: Json };
        Returns: Database["public"]["Tables"]["doacoes"]["Row"];
      };
      lancar_doacao: {
        Args: { p_doacao_id: string; p_nr_lancamento_erp: string; p_usuario?: string };
        Returns: Database["public"]["Tables"]["doacoes"]["Row"];
      };
      definir_perfil: { Args: { p_email: string; p_perfil: string }; Returns: undefined };
      cancelar_doacao_incompleta: { Args: { p_doacao_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type DoacaoRow = Database["public"]["Tables"]["doacoes"]["Row"];
export type DoacaoInsert = Database["public"]["Tables"]["doacoes"]["Insert"];
export type ItemRow = Database["public"]["Tables"]["doacao_itens"]["Row"];
export type DocumentoRow = Database["public"]["Tables"]["doacao_documentos"]["Row"];
export type LogRow = Database["public"]["Tables"]["doacao_log"]["Row"];
export type ClassificacaoRow = Database["public"]["Tables"]["ref_classificacao"]["Row"];
export type PerfilRow = Database["public"]["Tables"]["perfis_usuario"]["Row"];
