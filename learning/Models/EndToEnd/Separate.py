import math
import sys

import numpy as np
import tensorflow as tf

from learning.Utils.Layer import Layers
from learning.Utils.Logging import Logger
from learning.Utils.ReadData import Data

dir = Logger.getNewDir("../out/Separate")
log = Logger(dir)
D = Data(log, 6003, sequence=False)
L = Layers()

def ave(l):
  return sum(l) / len(l);

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###           (x,y,z) coordinates for every block in the environment (floats)
###  Output:  3 floats    (x,y,z)
###           1 int       Predicted Block ID
###  Model:   Text  -> uniform linear -> softmax
###           Text,World -> uniform linear -> (x,y,z)
###  Loss:    Mean Squared Error
###           Mean Cross Entropy

sess = tf.Session()
text_dim = len(D.Train["text"][0])
world_dim = len(D.Train["world"][0])
x_t = L.placeholder(text_dim, 'text')
x_w = L.placeholder(world_dim, 'world')
y_A = L.placeholder(3, 'y_Action')
y_C = L.placeholder(20, 'y_Class')  # 20 blocks

# Model variables
W_w = L.uniform_W(text_dim + world_dim, 3, 'W_w')
b_w = L.uniform_b(3, 'b_w')
W_t = L.uniform_W(text_dim, 20, 'W_t')
b_t = L.uniform_b(20, 'b_t')

# Model structure
y_re = tf.matmul(tf.concat(1, [x_t, x_w]), W_w) + b_w
y_sf = tf.nn.softmax(tf.matmul(x_t, W_t) + b_t)

# mean Cross Entropy for Softmax + MSE
loss_sf = -1 * tf.reduce_sum(tf.mul(y_C, tf.log(y_sf)))  # One prediction
loss_mse = tf.reduce_sum(tf.square(tf.sub(y_A, y_re)))  # Three predictions


def compute_loss_sf():
  return (sess.run(loss_sf, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_C: D.Train["classes"]}),
          sess.run(loss_sf, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"], y_C: D.Test["classes"]}))


def compute_loss_re():
  return (sess.run(loss_mse, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"]}),
          sess.run(loss_mse, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"], y_A: D.Test["actions"]}))

############################# Train Model #####################################

log.write("Training")

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
decay_re = tf.train.exponential_decay(0.0001, global_step, 100000, 1e-6, staircase=False)
train_step_re = tf.train.GradientDescentOptimizer(decay_re).minimize(loss_mse)
train_step_sf = tf.train.GradientDescentOptimizer(starter_learning_rate).minimize(loss_sf)

sess.run(tf.initialize_all_variables())

log.write("Regression")
batches = D.minibatch([D.Train["text"], D.Train["world"], D.Train["actions"]])
oldLoss = [compute_loss_re()[0]]
for i in range(100):
  for a,b,c in batches:
    sess.run(train_step_re, feed_dict={x_t: a, x_w: b, y_A: c})
  Loss = compute_loss_re()
  newLoss = Loss[0]
  rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
  log.write("%3d %10.7f %10.7f -->   %11.10f" % (i, newLoss, Loss[1], rat))
  oldLoss.append(newLoss)
  if abs(rat) < 0.01:
    break
  if len(oldLoss) > 3: oldLoss.pop(0)
  if math.isnan(newLoss) or math.isinf(newLoss):
    log.write("Check yo gradients: %9.2f" % newLoss)
    sys.exit()

log.write("Softmax")
batches = D.minibatch([D.Train["text"], D.Train["classes"]])
oldLoss = [compute_loss_sf()[0]]
for i in range(100):
  for a,b in D.scrambled(batches):
    sess.run(train_step_sf, feed_dict={x_t: a, y_C: b})
  Loss = compute_loss_sf()
  newLoss = Loss[0]
  rat = (ave(oldLoss) - newLoss) / ave(oldLoss)
  log.write("%3d %10.7f  %10.7f -->   %11.10f" % (i, newLoss, Loss[1], rat))
  if abs(rat) < 0.01:
    break
  oldLoss.append(newLoss)
  if len(oldLoss) > 3: oldLoss.pop(0)
  if math.isnan(newLoss) or math.isinf(newLoss):
    log.write("Check yo gradients: %9.2f" % newLoss)
    sys.exit()

############################# Predict From Model ##############################
log.write("Testing")
predicted_sf = sess.run(y_sf, feed_dict={x_t: D.Test["text"]})
predicted_re = sess.run(y_re, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"]})

predicted_id = []
for i in range(len(predicted_re)):
  predicted_id.append([sess.run(tf.argmax(predicted_sf[i], 0))])
D.write_predictions(np.concatenate((predicted_id, predicted_re), axis=1), dir=dir)


predicted_sf = sess.run(y_sf, feed_dict={x_t: D.Train["text"]})
predicted_re = sess.run(y_re, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"]})

predicted_id = []
for i in range(len(predicted_re)):
  predicted_id.append([sess.run(tf.argmax(predicted_sf[i], 0))])
D.write_predictions(np.concatenate((predicted_id, predicted_re), axis=1), dir=dir, filename="Train", Test=False)
