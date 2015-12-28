import math
import random
import sys

import editdistance
import numpy as np
import tensorflow as tf
from nltk.tokenize import TreebankWordTokenizer

from learning.Utils.Layer import Layers
from learning.Utils.Logging import Logger
from learning.Utils.ReadData import Data

dir = Logger.getNewDir("../out/ModelA-String")
log = Logger(dir)
D = Data(log, 6003, sequence=False)
L = Layers()


def distance((x, y, z), (a, b, c)):
  return math.sqrt((x - a) ** 2 + (y - b) ** 2 + (z - c) ** 2)

def ave(l):
  return sum(l) / len(l);

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
  random.seed(12192015)
  bc = 0
  ba = 0
  zer = 0
  for i in range(len(Class)):
    blocks = set()
    if train:
      sent = D.TrainingInput[i]["text"]
    else:
      sent = D.TestingInput[i]["text"]
    goal_location = Actions[i]
    words = TreebankWordTokenizer().tokenize(sent)
    for brand in D.brands:
      brandparts = brand.split()
      for part in brandparts:
        for word in words:
          if editdistance.eval(part, word) < 2:
            blocks.add(D.brands.index(brand))

    if train:
      act = D.TrainingOutput[i]["id"] - 1
    else:
      act = D.TestingOutput[i]["id"] - 1
    if act in blocks:
      blocks.remove(act)
    ## Possible reference blocks
    if len(blocks) > 0:
      ba += len(blocks)
      bc += 1
      targetblock = blocks.pop()
    else:
      zer += 1
      targetblock = act
    Target.append(D.onehot(targetblock, 20))
    loc = World[i][3 * targetblock], World[i][3 * targetblock + 1], World[i][3 * targetblock + 2]

    # Discretize
    if loc[0] < goal_location[0] and loc[2] < goal_location[2]:     # SW
      RP.append(D.onehot(0, 8))
    elif loc[0] < goal_location[0] and loc[2] == goal_location[2]:  # W
      RP.append(D.onehot(1, 8))
    elif loc[0] < goal_location[0] and loc[2] > goal_location[2]:   # NW
      RP.append(D.onehot(2, 8))
    elif loc[0] == goal_location[0] and loc[2] > goal_location[2]:  # N
      RP.append(D.onehot(3, 8))
    elif loc[0] > goal_location[0] and loc[2] > goal_location[2]:   # NE
      RP.append(D.onehot(4, 8))
    elif loc[0] > goal_location[0] and loc[2] == goal_location[2]:  # E
      RP.append(D.onehot(5, 8))
    elif loc[0] > goal_location[0] and loc[2] < goal_location[2]:   # SE
      RP.append(D.onehot(6, 8))
    elif loc[0] == goal_location[0] and loc[2] < goal_location[2]:  # S
      RP.append(D.onehot(7, 8))
    else:
      log.write("ERR")
      sys.exit()

  log.write(("Train " if train else "Test ") + "possible:%d  found:%d  zero:%d" % (ba, bc, zer))
  log.write(("Train " if train else "Test ") + "Target: " + str(Target))
  log.write(("Train " if train else "Test ") + "RP: " + str(RP))
  return Text, Class, World, Actions, Target, RP

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###  Output:  3 ints    ID_s ID_t Lp  -- {blocks} {blocks} {0-8}
###  Model:   Text  -> uniform linear -> softmax   (x3)
###  Loss:    Mean Cross Entropy

sess = tf.Session()
text_dim = len(D.Train["text"][0])
x_t = L.placeholder(text_dim, 'text')
y_A = L.placeholder(8, 'y_Action')
y_C = L.placeholder(20, 'y_Class')
y_tC = L.placeholder(20, 'y_targetClass')

W_h = L.uniform_W(input_dim=text_dim, name='W_w')
b_h = L.uniform_b(name='b_t')

W_s = L.uniform_W(input_dim=text_dim, output_dim=20, name='W_w')
b_s = L.uniform_b(dim=20, name='b_t')
W_t = L.uniform_W(input_dim=text_dim, output_dim=20, name='W_w')
b_t = L.uniform_b(dim=20, name='b_t')
W_rp = L.uniform_W(input_dim=text_dim, output_dim=8, name='W_w')
b_rp = L.uniform_b(dim=8, name='b_t')

y_s = tf.nn.softmax(tf.matmul(x_t, W_s) + b_s)
y_t = tf.nn.softmax(tf.matmul(x_t, W_t) + b_t)
y_rp = tf.nn.softmax(tf.matmul(x_t, W_rp) + b_rp)

loss_sft = -1 * tf.reduce_sum(tf.mul(y_tC, tf.log(y_t)))  # One prediction
loss_sfs = -1 * tf.reduce_sum(tf.mul(y_C, tf.log(y_s)))  # One prediction
loss_sfr = -1 * tf.reduce_sum(tf.mul(y_A, tf.log(y_rp)))  # One prediction


## Create Data ##
Text, Class, World, Actions, Target, RP = createData(True)
Text_test, Class_test, World_test, Actions_test, Target_test, RP_test = createData(False)

def compute_loss_sfs():
  return (sess.run(loss_sfs, feed_dict={x_t: Text, y_A: RP, y_C: Class, y_tC: Target}),
         sess.run(loss_sfs, feed_dict={x_t: Text_test, y_A: RP_test, y_C: Class_test, y_tC: Target_test}))

def compute_loss_sft():
  return (sess.run(loss_sft, feed_dict={x_t: Text, y_A: RP, y_C: Class, y_tC: Target}),
         sess.run(loss_sft, feed_dict={x_t: Text_test, y_A: RP_test, y_C: Class_test, y_tC: Target_test}))

def compute_loss_sfr():
  return (sess.run(loss_sfr, feed_dict={x_t: Text, y_A: RP, y_C: Class, y_tC: Target}),
          sess.run(loss_sfr, feed_dict={x_t: Text_test, y_A: RP_test, y_C: Class_test, y_tC: Target_test}))


############################# Train Model #####################################

print "Training"

saver = tf.train.Saver()
merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
lrs = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sfs = tf.train.GradientDescentOptimizer(lrs).minimize(loss_sfs)
lrt = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sft = tf.train.GradientDescentOptimizer(lrt).minimize(loss_sft)
lrr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sfr = tf.train.GradientDescentOptimizer(lrr).minimize(loss_sfr)

sess.run(tf.initialize_all_variables())

if len(sys.argv) > 1:
  ckpt = tf.train.get_checkpoint_state(sys.argv[1])
  saver.restore(sess, ckpt.model_checkpoint_path)
else:
  log.write("Softmax Source")
  batches = D.minibatch([Text, Class, Target, RP])
  oldLoss = [compute_loss_sfs()[0]]
  for i in range(100):
    for a, b, c, d in D.scrambled(batches):
      sess.run(train_step_sfs, feed_dict={x_t: a, y_C: b, y_tC: c, y_A: d})
    Loss = compute_loss_sfs()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f -->   %11.10f" % (i, newLoss, Loss[1], rat))
    if abs(rat) < 0.01:
      break
    oldLoss.append(newLoss)
    if len(oldLoss) > 3: oldLoss.pop(0)
    if math.isnan(newLoss) or math.isinf(newLoss):
      log.write("Check yo gradients: %f" % newLoss)
      sys.exit()

  log.write("Softmax Target")
  oldLoss = [compute_loss_sft()[0]]
  for i in range(100):
    for a, b, c, d in D.scrambled(batches):
      sess.run(train_step_sft, feed_dict={x_t: a, y_C: b, y_tC: c, y_A: d})
    Loss = compute_loss_sft()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f -->   %11.10f" % (i, newLoss, Loss[1], rat))
    if abs(rat) < 0.01:
      break
    oldLoss.append(newLoss)
    if len(oldLoss) > 3: oldLoss.pop(0)
    if math.isnan(newLoss) or math.isinf(newLoss):
      log.write("Check yo gradients: %f " % newLoss)
      sys.exit()

  log.write("Softmax Position")
  oldLoss = [compute_loss_sfr()[0]]
  for i in range(100):
    for a, b, c, d in D.scrambled(batches):
      sess.run(train_step_sfr, feed_dict={x_t: a, y_C: b, y_tC: c, y_A: d})
    Loss = compute_loss_sfr()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f %10.7f -->   %11.10f" % (i, newLoss, Loss[1], rat))
    if abs(rat) < 0.01:
      break
    oldLoss.append(newLoss)
    if len(oldLoss) > 3: oldLoss.pop(0)
    if math.isnan(newLoss) or math.isinf(newLoss):
      log.write("Check yo gradients: %f " % newLoss)
      sys.exit()
if len(sys.argv) == 1:
  saver.save(sess, dir + '/model.ckpt')


############################# Predict From Model ##############################
log.write("Testing")

predicted_s = sess.run(y_s, feed_dict={x_t: D.Test["text"]})
predicted_t = sess.run(y_t, feed_dict={x_t: D.Test["text"]})
predicted_r = sess.run(y_rp, feed_dict={x_t: D.Test["text"]})
target_locs = []

predicted_id = []
for i in range(len(predicted_s)):
  predicted_id.append([sess.run(tf.argmax(predicted_s[i], 0))])
predicted_tid = []
for i in range(len(predicted_t)):
  predicted_tid.append(sess.run(tf.argmax(predicted_t[i], 0)))
predicted_rp = []
for i in range(len(predicted_r)):
  predicted_rp.append(sess.run(tf.argmax(predicted_r[i], 0)))

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

predicted_s = sess.run(y_s, feed_dict={x_t: D.Train["text"]})
predicted_t = sess.run(y_t, feed_dict={x_t: D.Train["text"]})
predicted_r = sess.run(y_rp, feed_dict={x_t: D.Train["text"]})
target_locs = []

predicted_id = []
for i in range(len(predicted_s)):
  predicted_id.append([sess.run(tf.argmax(predicted_s[i], 0))])
predicted_tid = []
for i in range(len(predicted_t)):
  predicted_tid.append(sess.run(tf.argmax(predicted_t[i], 0)))
predicted_rp = []
for i in range(len(predicted_r)):
  predicted_rp.append(sess.run(tf.argmax(predicted_r[i], 0)))

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
