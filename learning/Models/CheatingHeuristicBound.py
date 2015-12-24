import math
import editdistance
import random
import sys
from nltk.tokenize import TreebankWordTokenizer

import numpy as np
import tensorflow as tf

from learning.Utils.Logging import Logger
from learning.Utils.ReadData import Data

from learning.Utils.Layer import Layers

dir = Logger.getNewDir("../out/CheatHeuristic-Random")
log = Logger(dir)
D = Data(log, 6003, sequence=False)
L = Layers()

def createData(train=True):
  if train:
    Text = D.Train["text"]
    Class = D.Train["classes"]
    World = D.Train["world"]
    Actions = D.Train["actions"]
  else:
    Text = D.Test["text"]
    Class = D.Test["classes"]
    World = D.Test["world"]
    Actions = D.Test["actions"]
  Target = []
  RP = []
  err = []
  random.seed(12192015)
  bc = 0
  ba = 0
  zer = 0
  for i in range(len(Class)):
    blocks = set()
    sent = D.TrainingInput[i]["text"]
    goal_location = Actions[i]
    words = TreebankWordTokenizer().tokenize(sent)
    for brand in D.brands:
      brandparts = brand.split()
      for part in brandparts:
        for word in words:
          if editdistance.eval(part, word) < 2:
            blocks.add(D.brands.index(brand))

    act = D.TrainingOutput[i]["id"] - 1
    if act in blocks:
      blocks.remove(act)
    ## Possible reference blocks
    if len(blocks) > 0:
      d = 100000
      for block in blocks:
        loc = World[i][3 * block], World[i][3 * block + 1], World[i][3 * block + 2]
        dist = distance(loc, goal_location)
        if dist < d:
          d = dist
          targetblock = block
      ba += len(blocks)
      bc += 1
    else:
      zer += 1
      targetblock = act
    Target.append(targetblock)
    loc = World[i][3 * targetblock], World[i][3 * targetblock + 1], World[i][3 * targetblock + 2]

    # Discretize
    if loc[0] < goal_location[0] and loc[2] < goal_location[2]:     # SW
      RP.append(0)
    elif loc[0] < goal_location[0] and loc[2] == goal_location[2]:  # W
      RP.append(1)
    elif loc[0] < goal_location[0] and loc[2] > goal_location[2]:   # NW
      RP.append(2)
    elif loc[0] == goal_location[0] and loc[2] > goal_location[2]:  # N
      RP.append(3)
    elif loc[0] > goal_location[0] and loc[2] > goal_location[2]:   # NE
      RP.append(4)
    elif loc[0] > goal_location[0] and loc[2] == goal_location[2]:  # E
      RP.append(5)
    elif loc[0] > goal_location[0] and loc[2] < goal_location[2]:   # SE
      RP.append(6)
    elif loc[0] == goal_location[0] and loc[2] < goal_location[2]:  # S
      RP.append(7)

    d = 0.1666  # 524
    if RP[i] == 0:
      moved = [loc[0] + d, loc[1], loc[2] + d]  # SW
    elif RP[i] == 1:
      moved = [loc[0] + d, loc[1], loc[2]]  # W
    elif RP[i] == 2:
      moved = [loc[0] + d, loc[1], loc[2] - d]  # NW
    elif RP[i] == 3:
      moved = [loc[0], loc[1], loc[2] - d]  # N
    elif RP[i] == 4:
      moved = [loc[0] - d, loc[1], loc[2] - d]  # NE
    elif RP[i] == 5:
      moved = [loc[0] - d, loc[1], loc[2]]  # E
    elif RP[i] == 6:
      moved = [loc[0] - d, loc[1], loc[2] + d]  # SE
    elif RP[i] == 7:
      moved = [loc[0], loc[1], loc[2] + d]  # S

    err.append(distance(moved, goal_location))

  log.write(("Train " if train else "Test ") + "possible:%d  found:%d  zero:%d" % (ba, bc, zer))
  log.write(("Train " if train else "Test ") + "Target: " + str(Target))
  log.write(("Train " if train else "Test ") + "RP: " + str(RP))
  print sum(err),sum(err)/len(err)
  return Text, Class, World, Actions, Target, RP


def ave(l):
  return sum(l) / len(l);


def distance((x, y, z), (a, b, c)):
  return math.sqrt((x - a) ** 2 + (y - b) ** 2 + (z - c) ** 2) / 0.1524


def fromOneHot(l):
  for i in range(len(l)):
    if l[i] == 1:
      return i

## Create Data ##
Text, Class, World, Actions, Target, RP = createData(True)
Text_test, Class_test, World_test, Actions_test, Target_test, RP_test = createData(False)

############################# Predict From Model ##############################
log.write("Testing")


## Assume perfect source prediction
predicted_id = [[fromOneHot(c)] for c in Class_test]
predicted_tid = Target_test
predicted_rp = RP_test

predicted_locs = []
d = 0.1666  # 524
for i in range(len(predicted_rp)):
  w = D.Test["world"]
  t = (w[i][3 * predicted_tid[i]], w[i][3 * predicted_tid[i] + 1], w[i][3 * predicted_tid[i] + 2])
  if predicted_rp[i] == 0:
    predicted_locs.append([t[0] + d, t[1], t[2] + d])  # SW
  elif predicted_rp[i] == 1:
    predicted_locs.append([t[0] + d, t[1], t[2]])  # W
  elif predicted_rp[i] == 2:
    predicted_locs.append([t[0] + d, t[1], t[2] - d])  # NW
  elif predicted_rp[i] == 3:
    predicted_locs.append([t[0], t[1], t[2] - d])  # N
  elif predicted_rp[i] == 4:
    predicted_locs.append([t[0] - d, t[1], t[2] - d])  # NE
  elif predicted_rp[i] == 5:
    predicted_locs.append([t[0] - d, t[1], t[2]])  # E
  elif predicted_rp[i] == 6:
    predicted_locs.append([t[0] - d, t[1], t[2] + d])  # SE
  elif predicted_rp[i] == 7:
    predicted_locs.append([t[0], t[1], t[2] + d])  # S

log.write("Test predicted_tid: " + str(predicted_tid))
log.write("Test predicted_rp: " + str(predicted_rp))

D.write_predictions(np.concatenate((predicted_id, predicted_locs), axis=1), dir=dir)

predicted_id = [[fromOneHot(c)] for c in Class]
predicted_tid = Target
predicted_rp = RP

predicted_locs = []
for i in range(len(predicted_rp)):
  w = D.Train["world"]
  t = (w[i][3 * predicted_tid[i]], w[i][3 * predicted_tid[i] + 1], w[i][3 * predicted_tid[i] + 2])
  if predicted_rp[i] == 0:
    predicted_locs.append([t[0] + d, t[1], t[2] + d])  # SW
  elif predicted_rp[i] == 1:
    predicted_locs.append([t[0] + d, t[1], t[2]])  # W
  elif predicted_rp[i] == 2:
    predicted_locs.append([t[0] + d, t[1], t[2] - d])  # NW
  elif predicted_rp[i] == 3:
    predicted_locs.append([t[0], t[1], t[2] - d])  # N
  elif predicted_rp[i] == 4:
    predicted_locs.append([t[0] - d, t[1], t[2] - d])  # NE
  elif predicted_rp[i] == 5:
    predicted_locs.append([t[0] - d, t[1], t[2]])  # E
  elif predicted_rp[i] == 6:
    predicted_locs.append([t[0] - d, t[1], t[2] + d])  # SE
  elif predicted_rp[i] == 7:
    predicted_locs.append([t[0], t[1], t[2] + d])  # S

# log.write(predicted_id
log.write("Train predicted_tid: " + str(predicted_tid))
log.write("Train predicted_rp: " + str(predicted_rp))
D.write_predictions(np.concatenate((predicted_id, predicted_locs), axis=1), dir=dir, filename="Train", Test=False)
