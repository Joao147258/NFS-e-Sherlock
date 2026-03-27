import json
from api_client import buscar_dados_cnpj
from data_processor import processar_dados_cnpj

def executar():
    print("="*50)
    print(" "*10 + "CONSULTA DE CNPJ - BRASIL API")
    print("="*50)
    print("-> Digite o CNPJ para pesquisar.")
    print("-> Digite 'sair' (ou pressione Enter sem digitar nada) para finalizar.\n")

    while True:
        entrada = input("Digite o CNPJ a consultar: ").strip()
        
        # Condição de saída
        if entrada.lower() == 'sair' or entrada == '':
            print("\nPrograma encerrado.")
            break
            
        print(f"\n -> Buscando CNPJ {entrada} na base de dados...\n")
        dados_brutos = buscar_dados_cnpj(entrada)
        
        if dados_brutos:
            # Achata JSON (remove listas complexas) para ficar mais limpo
            dados_tratados = processar_dados_cnpj(dados_brutos)
            
            print("=" * 50)
            print(f" RESULTADO DA CONSULTA: {dados_tratados.get('razao_social', 'N/A')}")
            print("=" * 50)
            
            # Imprime cada chave e valor formatado no terminal
            for chave, valor in dados_tratados.items():
                print(f"{chave.upper()}: {valor}")
                
            print("=" * 50 + "\n")
        else:
            print(" [X] Erro ou CNPJ inexistente.\n")

if __name__ == "__main__":
    executar()
