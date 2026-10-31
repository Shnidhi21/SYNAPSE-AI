import hashlib


def generate_node_id(name):
    normalized = " ".join(name.lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def build_knowledge_graph(document):
    nodes = {}
    edges = []

    pages = document.get("pages", [])

    for page in pages:
        relationships = page.get(
            "relationship_analysis", {}
        ).get("relationships", [])

        for relationship in relationships:
            source = relationship["source"].strip()
            target = relationship["target"].strip()

            source_id = generate_node_id(source)
            target_id = generate_node_id(target)

            if source_id not in nodes:
                nodes[source_id] = {
                    "id": source_id,
                    "label": source,
                    "type": "ENTITY"
                }

            if target_id not in nodes:
                nodes[target_id] = {
                    "id": target_id,
                    "label": target,
                    "type": "ENTITY"
                }

            edges.append({
                "id": relationship["id"],
                "source": source_id,
                "target": target_id,
                "relation": relationship["relation"],
                "evidence": relationship["evidence"],
                "page_number": relationship["page_number"]
            })

    return {
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": list(nodes.values()),
        "edges": edges
    }