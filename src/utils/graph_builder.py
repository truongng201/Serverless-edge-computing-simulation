import networkx as nx

def build_graph(edge_server_names, edges):
    G = nx.Graph()
    for name in edge_server_names:
        G.add_node(name, storage_MB=500, replicas=[])

    for edge in edges:
        G.add_edge(edge[0], edge[1], latency=edge[2])

    return G

def add_edge(G, node1, node2, latency):
    G.add_edge(node1, node2, latency=latency)

def remove_edge(G, node1, node2):
    G.remove_edge(node1, node2)

def get_neighbors(G, node):
    return list(G.neighbors(node))

def get_node_data(G, node):
    return G.nodes[node]

def update_node_storage(G, node, amount):
    G.nodes[node]['storage_MB'] += amount

def add_replica(G, node, replica_id):
    G.nodes[node]['replicas'].append(replica_id)

def remove_replica(G, node, replica_id):
    G.nodes[node]['replicas'].remove(replica_id)