import numpy as np
import tensorflow as tf
import math
import sys
from ReadData import Data
from Layer import Layers
np.set_printoptions(threshold=np.nan)

D = Data(10000, sequence=False)
L = Layers()
D.Train["input"] = np.concatenate((D.Train["text"], D.Train["world"]), axis=1)
D.Test["input"] = np.concatenate((D.Test["text"], D.Test["world"]), axis=1)

input_dim = len(D.Train["input"][0])
output_dim = len(D.Train["actions"][0])

print "Read Data"

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###           (x,y,z) coordinates for every block in the environment (floats)
###  Output:  3 floats    (x,y,z)
###           1 int       Predicted Block ID
###  Model:   1 uniform hidden layer with a tanh
###           1 linear prediction layer for (x,y,z)
###           1 softmax layer for ID
###  Loss:    3 * Mean Squared Error
###           1 * Mean Cross Entropy

sess = tf.Session()
x = L.placeholder(input_dim, 'x')
y_A = L.placeholder(output_dim, 'y_Action')
y_C = L.placeholder(21, 'y_Class')  # 20 blocks

# Model variables with hidden layers initialized uniformly
W1 = L.uniform_W(input_dim, output_dim, 'W1')
b1 = L.uniform_b(output_dim, 'b1')
W2 = L.uniform_W(input_dim, 21, 'W2')
b2 = L.uniform_b(21, 'b2')

# Model structure
y_re = tf.matmul(x, W1) + b1
y_sf = tf.nn.softmax(tf.matmul(x, W2) + b2)

# L2 Loss
# loss = tf.nn.l2_loss(tf.sub(y, y_))
# MSE = 1/N Sum (y - y')^2
# loss = tf.reduce_mean(tf.square(tf.sub(y_, y)))

# mean Cross Entropy for Softmax + MSE
loss_sf = -1 * tf.reduce_mean(tf.mul(y_C, tf.log(y_sf)))  # One prediction
loss_mse = tf.reduce_mean(tf.square(tf.sub(y_A, y_re)))  # Three predictions
loss = loss_sf + 3 * loss_mse

def compute_loss():
  return sess.run(loss, feed_dict={x: D.Train["input"], y_A: D.Train["actions"], y_C: D.Train["classes"]})
def compute_loss_sf():
  return sess.run(loss_sf, feed_dict={x: D.Train["input"], y_A: D.Train["actions"], y_C: D.Train["classes"]})
def compute_loss_mse():
  return sess.run(loss_mse, feed_dict={x: D.Train["input"], y_A: D.Train["actions"], y_C: D.Train["classes"]})

############################# Train Model #####################################

print "Training"

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.0001
# lr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-4, staircase=False)
# train_step = tf.train.MomentumOptimizer(lr,0.01).minimize(loss, global_step=global_step)
train_step = tf.train.GradientDescentOptimizer(starter_learning_rate).minimize(loss)

sess.run(tf.initialize_all_variables())

oldLoss = compute_loss()
oldLoss_sf = compute_loss_sf()
oldLoss_mse = compute_loss_mse()
print "iter %-10s  %-10s  %-10s   -->   %-11s" % ("Loss", "Mean CE", "MSE", "% Change")

## Create Minibatches ##
batches = D.minibatch([D.Train["input"], D.Train["actions"], D.Train["classes"]])

## Train for 10 Epochs ##
for i in range(10):
  for (a, b, c) in batches:
    sess.run(train_step, feed_dict={x: a, y_A: b, y_C: c})
  newLoss = compute_loss()
  newLoss_sf = compute_loss_sf()
  newLoss_mse = compute_loss_mse()
  print "%3d %10.7f  %10.7f  %10.7f   -->   %11.10f  %11.10f  %11.10f" % \
        (i, newLoss, newLoss_sf, newLoss_mse, (oldLoss - newLoss) / oldLoss,
         (oldLoss_sf - newLoss_sf) / oldLoss_sf, (oldLoss_mse - newLoss_mse) / oldLoss_mse)
  oldLoss = newLoss
  oldLoss_sf = newLoss_sf
  oldLoss_mse = newLoss_mse
  if math.isnan(newLoss) or math.isinf(newLoss):
    print "Check yo gradients: ", newLoss
    sys.exit()

############################# Predict From Model ##############################
print "Testing"
predicted_sf = sess.run(y_sf, feed_dict={x: D.Test["input"]})
predicted_re = sess.run(y_re, feed_dict={x: D.Test["input"]})

print "Test loss ", sess.run(loss, feed_dict={x: D.Test["input"], y_A: D.Test["actions"], y_C: D.Test["classes"]})

predicted_id = []
for i in range(len(predicted_re)):
  predicted_id.append([sess.run(tf.argmax(predicted_sf[i], 0))])
D.write_predictions(np.concatenate((predicted_id, predicted_re), axis=1))
