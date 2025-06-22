class ReplicaManager:
    def __init__(self, central_dt, edge_nodes):
        self.central_dt = central_dt
        self.edge_nodes = edge_nodes

    def place_replica(self, edge_node, replica_data):
        if edge_node in self.edge_nodes:
            edge_node.add_replica(replica_data)
            print(f"Replica placed on {edge_node.name}: {replica_data}")
        else:
            print(f"Edge node {edge_node.name} not found.")

    def remove_replica(self, edge_node, replica_data):
        if edge_node in self.edge_nodes:
            edge_node.remove_replica(replica_data)
            print(f"Replica removed from {edge_node.name}: {replica_data}")
        else:
            print(f"Edge node {edge_node.name} not found.")

    def update_replica(self, edge_node, old_replica_data, new_replica_data):
        if edge_node in self.edge_nodes:
            edge_node.update_replica(old_replica_data, new_replica_data)
            print(f"Replica updated on {edge_node.name}: {old_replica_data} -> {new_replica_data}")
        else:
            print(f"Edge node {edge_node.name} not found.")

    def get_replicas(self, edge_node):
        if edge_node in self.edge_nodes:
            return edge_node.get_replicas()
        else:
            print(f"Edge node {edge_node.name} not found.")
            return None

    def synchronize_replicas(self):
        for edge_node in self.edge_nodes:
            edge_node.synchronize_with_central(self.central_dt)
            print(f"Synchronized replicas on {edge_node.name} with central digital twin.")