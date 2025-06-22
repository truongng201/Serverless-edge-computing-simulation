class EdgeDigitalTwin:
    def __init__(self, name, storage_capacity):
        self.name = name
        self.storage_capacity = storage_capacity
        self.replicas = []
        self.active_users = 0
        self.last_activity_time = 0

    def add_replica(self, replica):
        if self.get_available_storage() >= replica.size:
            self.replicas.append(replica)
            return True
        return False

    def remove_replica(self, replica):
        if replica in self.replicas:
            self.replicas.remove(replica)

    def get_available_storage(self):
        used_storage = sum(replica.size for replica in self.replicas)
        return self.storage_capacity - used_storage

    def communicate_with_central(self, central_dt):
        # Placeholder for communication logic with the central digital twin
        pass

    def handle_user_activity(self):
        """Handle user activity when a user is connected to this edge node"""
        self.active_users += 1
        import time
        self.last_activity_time = time.time()
        print(f"EdgeDT {self.name}: User activity detected. Active users: {self.active_users}")

    def synchronize_with_central(self, central_dt):
        """Synchronize this edge digital twin with the central digital twin"""
        print(f"EdgeDT {self.name}: Synchronizing with central digital twin...")
        status = self.get_status()
        print(f"EdgeDT {self.name}: Sync completed. Status: {status}")

    def get_status(self):
        """Get the current status of this edge digital twin"""
        return {
            'name': self.name,
            'active_users': self.active_users,
            'replicas_count': len(self.replicas),
            'available_storage': self.get_available_storage(),
            'last_activity': self.last_activity_time
        }

class Replica:
    def __init__(self, size):
        self.size = size