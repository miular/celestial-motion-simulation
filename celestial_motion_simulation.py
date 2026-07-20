import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider
import json


G = 6.67430e-11
SIMULATION_DAYS = 180
DT = 3600

def load_system(filepath,system_name):
    with open(filepath, 'r', encoding='utf-8') as file:
        galaxy = json.load(file)

        return galaxy[system_name] 

SYSTEM_CONFIG = load_system('galaxy.json','figure_eight_three_body')    #change this to select a galaxy


class planet():

    count = 0
    
    def __init__(self,name,mass,position,velocity,color,size):
        self.name = name
        self.mass = mass
        self.position = np.array(position)
        self.velocity = np.array(velocity)
        self.acceleration = np.array([0.0,0.0])
        self.color = color
        self.size = size

        planet.count += 1
        self.id = planet.count

    def update_velocity(self,all_planets, dt=3600):
        acc = np.array([0.0,0.0])
        for other in all_planets:
            if other == self:
                continue
            r_vector = other.position - self.position
            r_mag = np.linalg.norm(r_vector)
            acc += G * (other.mass / max(r_mag,0.1)**3) * r_vector
        self.acceleration = acc
        self.velocity += acc * dt


    def update_position(self,dt=3600):
        self.position = self.position + dt * self.velocity



step = SIMULATION_DAYS * 24

universe = [planet(**cfg) for cfg in SYSTEM_CONFIG]
num_planets = len(universe)


pos = np.zeros((num_planets,step,2))


for i in range(step):
    for p in universe:
        p.update_velocity(universe,DT)
    
    for p in universe:
        p.update_position(DT)
        pos[p.id -1, i] = p.position


fig, ax = plt.subplots(figsize=(8,8))   #create figure and subplots
plt.subplots_adjust(bottom=0.2)     #reverse place at the bottom for slider

labels = [p.name for p in universe]
colors = [p.color for p in universe]


for p_idx, p in enumerate(universe):    #plot the comlpete orbit as a dashed background
    ax.plot(pos[p_idx,:,0], pos[p_idx,:,1], color=p.color, alpha=0.3, linestyle='--')

current_dots = []
for p_idx, p in enumerate(universe):
    x0 = pos[p_idx, 0, 0]
    y0 = pos[p_idx, 0, 1]
    dot = ax.scatter(x0, y0, color=colors[p_idx], s=p.size, alpha= 0.8, label=labels[p_idx])
    current_dots.append(dot)

ax.set_title('Celestial motion simulation', fontsize=12)
ax.grid(True, linestyle='--', alpha=0.5)
ax.axis('equal')
ax.legend(loc='best')

#create slider components
ax_slider = plt.axes([0.2, 0.05, 0.6, 0.03])
time_slider = Slider(
    ax=ax_slider,
    label='Time Step ',
    valmin=0,
    valmax=step - 1,
    valinit=0,
    valfmt='%d'  
)

def update(val):    #define the update function for slider interactions
    step_idx = int(time_slider.val)

    for p_idx, p in enumerate(universe):
        nx = pos[p_idx, step_idx, 0]
        ny = pos[p_idx, step_idx, 1]


        current_dots[p_idx].set_offsets(np.array([[nx, ny]]))
    
    fig.canvas.draw_idle()

time_slider.on_changed(update)

plt.show()



