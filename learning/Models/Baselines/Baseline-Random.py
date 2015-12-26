import math
import random

import numpy as np

from learning.Utils.Layer import Layers
from learning.Utils.Logging import Logger
from learning.Utils.ReadData import Data

dir = Logger.getNewDir("../out/Baseline-Random")
log = Logger(dir)
D = Data(log, 6003, sequence=False)
L = Layers()


def ave(l):
  return sum(l) / len(l);


def distance((x, y, z), (a, b, c)):
  return math.sqrt((x - a) ** 2 + (y - b) ** 2 + (z - c) ** 2) / 0.1524


def fromOneHot(l):
  for i in range(len(l)):
    if l[i] == 1:
      return i

## Create Data ##

############################# Predict From Model ##############################
log.write("Testing")

random.seed(12242015)

predicted_id = D.numbers(D.Test["classes"])
predicted_locs = []
for i in range(len(predicted_id)):
  predicted_locs.append([random.random()*2 - 1, 0.1, random.random()*2 - 1])
D.write_predictions(np.concatenate((predicted_id, predicted_locs), axis=1), dir=dir)

predicted_id = D.numbers(D.Train["classes"])
predicted_locs = []
for i in range(len(predicted_id)):
  predicted_locs.append([random.random()*2 - 1, 0.1, random.random()*2 - 1])
D.write_predictions(np.concatenate((predicted_id, predicted_locs), axis=1), dir=dir, filename="Train", Test=False)
