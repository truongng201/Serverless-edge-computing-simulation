import random
import numpy as np

class MobilitySimulator:
    def __init__(self, central_dt, edge_nodes, num_users=5):
        self.central_dt = central_dt
        self.edge_nodes = edge_nodes
        self.num_users = num_users
        self.users = []
        self.step_count = 0
        
        # Create multiple external users
        for i in range(num_users):
            user = {
                'id': f"User_{random.randint(1000, 9999)}",
                'bandwidth': random.randint(10, 100),
                'path': [],
                'current_location': None
            }
            self.users.append(user)
        
        print(f"🌐 Created {num_users} external users:")
        for i, user in enumerate(self.users):
            print(f"   👤 {user['id']} - Bandwidth: {user['bandwidth']}Mbps")
        
    def simulate_user_mobility(self, steps):
        """Simulate multiple users moving between edge nodes"""
        for _ in range(steps):
            # Reset active users for all nodes first
            for node in self.edge_nodes:
                node.active_users = 0
            
            # Move each user
            for user in self.users:
                new_location = self.get_user_location(user)
                user['current_location'] = new_location
                user['path'].append(new_location)
                
                # Update edge node activity
                if new_location:
                    new_location.handle_user_activity()
            
            self.step_count += 1

    def get_user_location(self, user):
        """Determine current location for a specific user"""
        if not user['path']:
            # First location is random
            return random.choice(self.edge_nodes)
        else:
            # 60% chance to stay, 40% chance to move
            if random.random() < 0.4:
                return random.choice(self.edge_nodes)
            else:
                return user['path'][-1]

    def get_users_summary(self):
        """Get summary of all users"""
        summary = {
            'total_users': len(self.users),
            'user_locations': {},
            'active_nodes': set()
        }
        
        for user in self.users:
            current_loc = user['current_location']
            if current_loc:
                location_name = current_loc.name
                summary['active_nodes'].add(location_name)
                if location_name not in summary['user_locations']:
                    summary['user_locations'][location_name] = []
                summary['user_locations'][location_name].append(user['id'])
        
        return summary
    
    def get_primary_user_info(self):
        """Get information about the primary user for display"""
        if not self.users:
            return {}
            
        primary_user = self.users[0]  # Use first user as primary
        current_location = primary_user['current_location']
        latency = random.randint(5, 50) if current_location else None
        
        return {
            'user_id': primary_user['id'],
            'bandwidth': primary_user['bandwidth'],
            'latency': latency,
            'current_node': current_location.name if current_location else None,
            'step': self.step_count,
            'total_users': len(self.users)
        }
    
    def calculate_connection_metrics(self, current_location):
        """Calculate connection metrics for the user at current location"""
        if not current_location:
            return {}
            
        # Use primary user's bandwidth for calculations
        primary_user = self.users[0] if self.users else None
        user_bandwidth = primary_user['bandwidth'] if primary_user else 50
            
        # Simulate realistic metrics
        base_latency = 10
        distance_factor = random.uniform(0.5, 2.0)
        load_factor = random.uniform(0.8, 1.5)
        
        latency = int(base_latency * distance_factor * load_factor)
        packet_loss = round(random.uniform(0.1, 2.0), 2)
        throughput = int(user_bandwidth * random.uniform(0.7, 0.95))
        
        return {
            'latency_ms': latency,
            'packet_loss_%': packet_loss,
            'throughput_mbps': throughput,
            'jitter_ms': random.randint(1, 10)
        }