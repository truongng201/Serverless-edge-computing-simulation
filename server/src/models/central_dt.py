class CentralDigitalTwin:
    def __init__(self, name, storage_capacity):
        self.name = name
        self.storage_capacity = storage_capacity
        self.edge_nodes = []
        self.replicas = []

    def add_edge_node(self, edge_node):
        self.edge_nodes.append(edge_node)

    def get_available_storage(self):
        """Calculate available storage by subtracting used storage from total capacity"""
        used_storage = sum(replica.size if hasattr(replica, 'size') else 10 for replica in self.replicas)
        return max(0, self.storage_capacity - used_storage)

    def add_replica(self, replica):
        """Add a replica to the central digital twin"""
        if self.get_available_storage() >= (replica.size if hasattr(replica, 'size') else 10):
            self.replicas.append(replica)
            return True
        return False

    def remove_replica(self, replica):
        """Remove a replica from the central digital twin"""
        if replica in self.replicas:
            self.replicas.remove(replica)

    def manage_replicas(self):
        for edge_node in self.edge_nodes:
            if edge_node.has_sufficient_storage():
                edge_node.store_replica(self)

    def coordinate_operations(self):
        for edge_node in self.edge_nodes:
            edge_node.perform_local_operations()

    def __str__(self):
        return f"CentralDigitalTwin(name={self.name}, storage_capacity={self.storage_capacity}, edge_nodes={len(self.edge_nodes)})"