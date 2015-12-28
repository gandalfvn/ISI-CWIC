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

dir = Logger.getNewDir("../out/ModelB-String-2-Hidden")
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
  Target2 = []
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
    if len(blocks) > 0:
      Target2.append(D.onehot(blocks.pop(), 20))
    else:
      Target2.append(D.onehot(targetblock, 20))

  log.write(("Train " if train else "Test ") + "possible:%d  found:%d  zero:%d" % (ba, bc, zer))
  log.write(("Train " if train else "Test ") + "Target: " + str(Target))
  log.write(("Train " if train else "Test ") + "Target2: " + str(Target2))
  return Text, Class, World, Actions, Target, Target2


############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###  Output:  3 ints    ID_s ID_t Lp  -- {blocks} {blocks} {0-8}
###  Model:   Text  -> uniform linear -> softmax   (x3)
###  Loss:    Mean Cross Entropy

sess = tf.Session()
text_dim = len(D.Train["text"][0])
world_dim = len(D.Train["world"][0])
x_t = L.placeholder(text_dim, 'text')
x_w = L.placeholder(world_dim, 'world')
y_A = L.placeholder(3, 'y_Action')
y_C = L.placeholder(20, 'y_Class')
y_tC = L.placeholder(20, 'y_targetClass')
y_tC2 = L.placeholder(20, 'y_targetClass2')

W_s = L.uniform_W(input_dim=text_dim, output_dim=20, name='W_w')
b_s = L.uniform_b(dim=20, name='b_t')
W_ht = L.uniform_W(input_dim=text_dim, output_dim=100, name='W_t')
b_ht = L.uniform_b(dim=100, name='b_t')
W_ht2 = L.uniform_W(input_dim=text_dim, output_dim=100, name='W_tw')
b_ht2 = L.uniform_b(dim=100, name='b_t2')
W_hrp = L.uniform_W(input_dim=(text_dim + world_dim + 60), output_dim=100, name='W_w')
b_hrp = L.uniform_b(dim=100, name='b_t')

W_t = L.uniform_W(input_dim=100, output_dim=20, name='W_t')
b_t = L.uniform_b(dim=20, name='b_t')
W_t2 = L.uniform_W(input_dim=100, output_dim=20, name='W_tw')
b_t2 = L.uniform_b(dim=20, name='b_t2')
W_rp = L.uniform_W(input_dim=100, output_dim=3, name='W_w')
b_rp = L.uniform_b(dim=3, name='b_t')


e_s = tf.matmul(x_t, W_s) + b_s                 ## Source
h_t = tf.tanh(tf.matmul(x_t, W_ht) + b_ht)      ## Target 1
d_t = tf.nn.dropout(h_t, 0.8, seed=12122015)
e_t = tf.matmul(h_t, W_t) + b_t
h_t2 = tf.tanh(tf.matmul(x_t, W_ht2) + b_ht2)   ## Target 2
d_t2 = tf.nn.dropout(h_t, 0.8, seed=12122015)
e_t2 = tf.matmul(h_t2, W_t2) + b_t2

y_s = tf.nn.softmax(e_s)
y_t = tf.nn.softmax(e_t)
y_t2 = tf.nn.softmax(e_t2)


h_t2 = tf.tanh(tf.matmul(tf.concat(1, [x_t, x_w, e_s, e_t, e_t2]), W_hrp) + b_hrp)   ## Target 2
d_t2 = tf.nn.dropout(h_t, 0.8, seed=12122015)
y_rp = tf.matmul(d_t2, W_rp) + b_rp

loss_sft = -1 * tf.reduce_sum(tf.mul(y_tC, tf.log(y_t)))  # One prediction
loss_sft2 = -1 * tf.reduce_sum(tf.mul(y_tC2, tf.log(y_t2)))  # One prediction
loss_sfs = -1 * tf.reduce_sum(tf.mul(y_C, tf.log(y_s)))  # One prediction
# MSE = 1/N Sum (y - y')^2
loss_sfr = tf.reduce_sum(tf.square(tf.sub(y_A, y_rp)))

## Create Data ##
Text, Class, World, Actions, Target, Target2 = createData(True)
Text_test, Class_test, World_test, Actions_test, Target_test, Target2_test = createData(False)


def compute_loss_sfs():
  return (sess.run(loss_sfs, feed_dict={x_t: Text, x_w: World, y_A: Actions, y_C: Class, y_tC: Target, y_tC2: Target2}),
          sess.run(loss_sfs, feed_dict={x_t: Text_test, x_w: World_test, y_A: Actions_test, y_C: Class_test, y_tC: Target_test, y_tC2: Target2_test}))


def compute_loss_sft():
  return (sess.run(loss_sft, feed_dict={x_t: Text, x_w: World, y_A: Actions, y_C: Class, y_tC: Target, y_tC2: Target2}),
          sess.run(loss_sft, feed_dict={x_t: Text_test, x_w: World_test, y_A: Actions_test, y_C: Class_test, y_tC: Target_test, y_tC2: Target2_test}))


def compute_loss_sft2():
  return (sess.run(loss_sft2, feed_dict={x_t: Text, x_w: World, y_A: Actions, y_C: Class, y_tC: Target, y_tC2: Target2}),
          sess.run(loss_sft2, feed_dict={x_t: Text_test, x_w: World_test, y_A: Actions_test, y_C: Class_test, y_tC: Target_test, y_tC2: Target2_test}))


def compute_loss_sfr():
  return (sess.run(loss_sfr, feed_dict={x_t: Text, x_w: World, y_A: Actions, y_C: Class, y_tC: Target, y_tC2: Target2}),
          sess.run(loss_sfr, feed_dict={x_t: Text_test, x_w: World_test, y_A: Actions_test, y_C: Class_test, y_tC: Target_test, y_tC2: Target2_test}))


############################# Train Model #####################################

log.write("Training")

saver = tf.train.Saver()
merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
lrs = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sfs = tf.train.GradientDescentOptimizer(lrs).minimize(loss_sfs)
lrt = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sft = tf.train.GradientDescentOptimizer(lrt).minimize(loss_sft)
lrt2 = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sft2 = tf.train.GradientDescentOptimizer(lrt2).minimize(loss_sft2)
lrr = tf.train.exponential_decay(0.0001, global_step, 100000, 1e-6, staircase=False)
train_step_sfr = tf.train.GradientDescentOptimizer(lrr).minimize(loss_sfr)

sess.run(tf.initialize_all_variables())

if len(sys.argv) > 1:
  ckpt = tf.train.get_checkpoint_state(sys.argv[1])
  saver.restore(sess, ckpt.model_checkpoint_path)
else:
  log.write("Softmax Source")
  batches = D.minibatch([Text, World, Class, Target, Target2, Actions])
  oldLoss = [compute_loss_sfs()[0]]
  for i in range(100):
    for a, b, c, d, e, f in D.scrambled(batches):
      sess.run(train_step_sfs, feed_dict={x_t: a, x_w: b, y_C: c, y_tC: d, y_tC2: e, y_A: f})
    Loss = compute_loss_sfs()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f  -->   %11.10f" % (i, newLoss, Loss[1], rat))
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
    for a, b, c, d, e, f in D.scrambled(batches):
      sess.run(train_step_sft, feed_dict={x_t: a, x_w: b, y_C: c, y_tC: d, y_tC2: e, y_A: f})
    Loss = compute_loss_sft()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f  -->   %11.10f" % (i, newLoss, Loss[1], rat))
    if abs(rat) < 0.001:
      break
    oldLoss.append(newLoss)
    if len(oldLoss) > 3: oldLoss.pop(0)
    if math.isnan(newLoss) or math.isinf(newLoss):
      log.write("Check yo gradients: %f" % newLoss)
      sys.exit()

  log.write("Softmax Target2")
  oldLoss = [compute_loss_sft2()[0]]
  for i in range(100):
    for a, b, c, d, e, f in D.scrambled(batches):
      sess.run(train_step_sft2, feed_dict={x_t: a, x_w: b, y_C: c, y_tC: d, y_tC2: e, y_A: f})
    Loss = compute_loss_sft2()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f  -->   %11.10f" % (i, newLoss, Loss[1], rat))
    if abs(rat) < 0.001:
      break
    oldLoss.append(newLoss)
    if len(oldLoss) > 3: oldLoss.pop(0)
    if math.isnan(newLoss) or math.isinf(newLoss):
      log.write("Check yo gradients: %f" % newLoss)
      sys.exit()

  log.write("Regression Position")
  oldLoss = [compute_loss_sfr()[0]]
  for i in range(100):
    for a, b, c, d, e, f in D.scrambled(batches):
      sess.run(train_step_sfr, feed_dict={x_t: a, x_w: b, y_C: c, y_tC: d, y_tC2: e, y_A: f})
    Loss = compute_loss_sfr()
    newLoss = Loss[0]
    rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
    log.write("%3d %10.7f  %10.7f  -->   %11.10f" % (i, newLoss, Loss[1], rat))
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
predicted_t2 = sess.run(y_t2, feed_dict={x_t: D.Test["text"]})
predicted_r = sess.run(y_rp, feed_dict={x_t: D.Test["text"], x_w : D.Test["world"]})

predicted_id = []
for i in range(len(predicted_s)):
  predicted_id.append([sess.run(tf.argmax(predicted_s[i], 0))])
predicted_tid = []
for i in range(len(predicted_t)):
  predicted_tid.append(sess.run(tf.argmax(predicted_t[i], 0)))
predicted_tid2 = []
for i in range(len(predicted_t2)):
  predicted_tid2.append(sess.run(tf.argmax(predicted_t2[i], 0)))

log.write("Test predicted_id: " + str(predicted_id))
log.write("Test predicted_tid: " + str(predicted_tid))
log.write("Test predicted_tid2: " + str(predicted_tid2))

D.write_predictions(np.concatenate((predicted_id, predicted_r), axis=1), dir=dir)
