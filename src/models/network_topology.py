class NetworkTopology:
    def __init__(self):
        self.central_dt = None
        self.edge_nodes = []

    def set_central_digital_twin(self, central_dt):
        self.central_dt = central_dt

    def add_edge_node(self, edge_dt):
        self.edge_nodes.append(edge_dt)

    def get_edge_nodes(self):
        return self.edge_nodes

    def get_central_digital_twin(self):
        return self.central_dt

    def display_topology(self):
        print("Central Digital Twin:", self.central_dt)
        print("Edge Nodes:")
        for edge_node in self.edge_nodes:
            print("-", edge_node)