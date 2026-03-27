def processar_dados_cnpj(dados_brutos: dict) -> dict:
    """
    Achata e trata o JSON da Brasil API para facilitar a exportação para Excel.
    Os campos que possuem listas dentro (qsa, cnaes_secundarios, regime_tributario)
    serão convertidos para texto separado por ' | '.
    """
    dados = dados_brutos.copy()
    
    # 1. Processar Socios (QSA)
    qsa = dados.get("qsa", [])
    socios_str = []
    if qsa:
        for socio in qsa:
            if isinstance(socio, dict) and socio.get("nome_socio"):
                nome = socio.get("nome_socio")
                qualificacao = socio.get("qualificacao_socio", "Sem Qualificação")
                socios_str.append(f"{nome} ({qualificacao})")
    dados["socios_qsa"] = " | ".join(socios_str) if socios_str else "Não Informado"
    
    # 2. Processar CNAEs Secundarios
    cnaes = dados.get("cnaes_secundarios", [])
    cnaes_str = []
    if cnaes:
        for cnae in cnaes:
            if isinstance(cnae, dict) and cnae.get("codigo"):
                codigo = cnae.get("codigo")
                desc = cnae.get("descricao", "")
                cnaes_str.append(f"{codigo} - {desc}")
    dados["cnaes_secundarios_flat"] = " | ".join(cnaes_str) if cnaes_str else "Nenhum"
    
    # 3. Processar Regime Tributário
    regimes = dados.get("regime_tributario", [])
    regimes_str = []
    if regimes:
        for regime in regimes:
            if isinstance(regime, dict) and regime.get("ano"):
                ano = regime.get("ano")
                forma = regime.get("forma_de_tributacao", "")
                regimes_str.append(f"{ano}: {forma}")
    dados["regime_tributario_flat"] = " | ".join(regimes_str) if regimes_str else "Não Informado"
    
    # Remove as listas originais do dicionário para que o Pandas consiga formatar corretamente no Excel
    for chave in ["qsa", "cnaes_secundarios", "regime_tributario"]:
        if chave in dados:
            del dados[chave]
            
    return dados
