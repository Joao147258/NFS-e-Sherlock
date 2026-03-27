import json
import os
import subprocess

ARQUIVO_JSON = os.path.join("layouts", "provedores.json")

def carregar_provedores():
    """Carrega o banco de dados JSON de layouts."""
    if not os.path.exists(ARQUIVO_JSON):
        os.makedirs(os.path.dirname(ARQUIVO_JSON), exist_ok=True)
        return {}
    
    with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def salvar_provedores(dados):
    """Salva os dados no arquivo JSON atualizado."""
    with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

def sincronizar_github(ibge):
    """Executa a sequência de comandos Git para Versionamento Automático."""
    print("\n[Git] Iniciando sincronização com o GitHub...")
    try:
        # git add
        subprocess.run(["git", "add", ARQUIVO_JSON], check=True)
        
        # git commit
        mensagem = f"feat: adiciona layout/provedor para IBGE {ibge}"
        subprocess.run(["git", "commit", "-m", mensagem], check=True)
        
        # git push
        subprocess.run(["git", "push"], check=True)
        
        print(f"[Git] ✨ Sincronização concluída! Layout do IBGE {ibge} está online e disponível no formato Raw.")
    except subprocess.CalledProcessError as e:
        print(f"[Erro Git] Falha na comunicação com o repositório remoto. Verifique se o Git está configurado.\nDetalhes: {e}")

def main():
    print("="*60)
    print("⚙️  GERENCIADOR DE LAYOUTS NFS-e (API SERVERLESS)")
    print("="*60)
    
    ibge = input("Digite o código IBGE do município (ex: 4127700): ").strip()
    
    if not ibge.isdigit():
        print("[X] Erro: O código IBGE deve conter apenas números.")
        return

    dados_locais = carregar_provedores()
    
    # 1. Busca no Cache
    if ibge in dados_locais:
        info = dados_locais[ibge]
        print("\n[✓] CACHE HIT: Município já mapeado!")
        print(f" -> Cidade:   {info.get('cidade', 'N/A')}")
        print(f" -> Provedor: {info.get('provedor', 'N/A')}")
        print(f" -> URL XSD:  {info.get('xsd_url', 'N/A')}")
        
    # 2. Interação Humana (Aprendizado)
    else:
        print("\n[!] CACHE MISS: Código IBGE não encontrado localmente.")
        print("Iniciando fluxo de aprendizado...")
        cidade = input(" -> Digite o nome da cidade (Ex: Toledo-PR): ").strip()
        provedor = input(" -> Quem é o provedor desta cidade? ").strip()
        xsd_url = input(" -> Qual a URL do arquivo XSD oficial? ").strip()
        
        # 3. Auto-Atualização
        dados_locais[ibge] = {
            "cidade": cidade,
            "provedor": provedor,
            "xsd_url": xsd_url
        }
        salvar_provedores(dados_locais)
        print("\n[✓] Banco de Dados atualizado! (layouts/provedores.json)")
        
        # 4. Disponibilidade Imediata via Git
        sincronizar_github(ibge)

if __name__ == "__main__":
    main()
