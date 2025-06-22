class AnimationController:
    def __init__(self, simulation):
        self.simulation = simulation

    def update(self, frame):
        self.simulation.update(frame)
        self.simulation.render()

    def run_animation(self):
        import matplotlib.pyplot as plt
        import matplotlib.animation as animation

        fig, ax = plt.subplots(figsize=(8, 6))
        ani = animation.FuncAnimation(fig, self.update, frames=self.simulation.steps, interval=1500, repeat=False)
        plt.show()