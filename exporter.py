import pandas as pd
from datetime import datetime

def salvar_em_excel(lista_empresas: list, nome_base: str = "consulta_cnpjs"):
    """
    Recebe uma lista de dicionários tratada, converte para DataFrame e salva em .xlsx.
    """
    if not lista_empresas:
        print("Nenhuma empresa na lista para salvar.")
        return
    
    # Cria o DataFrame
    df = pd.DataFrame(lista_empresas)
    
    # Reordenar algumas colunas principais para o começo do Excel
    colunas_excel = df.columns.tolist()
    colunas_prioridade = ["cnpj", "razao_social", "nome_fantasia", "descricao_situacao_cadastral", "uf", "municipio"]
    
    colunas_ok = [col for col in colunas_prioridade if col in colunas_excel]
    colunas_resto = [col for col in colunas_excel if col not in colunas_prioridade]
    
    # Nova ordem das colunas
    df = df[colunas_ok + colunas_resto]
    
    # Adicionar data no nome do arquivo
    data_hoje = datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_arquivo = f"{nome_base}_{data_hoje}.xlsx"
    
    try:
        df.to_excel(nome_arquivo, index=False, engine='openpyxl')
        print(f"\n[SUCESSO] Relatório salvo na pasta atual como: '{nome_arquivo}'")
    except Exception as e:
        print(f"\n[ERRO] Não foi possível salvar o arquivo Excel: {e}")
