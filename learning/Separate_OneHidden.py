import math
import sys
import numpy as np
import tensorflow as tf
from ReadData import Data
from Layer import Layers

D = Data(10000, sequence=False)
L = Layers()

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###           (x,y,z) coordinates for every block in the environment (floats)
###  Output:  3 floats    (x,y,z)
###           1 int       Predicted Block ID
###  Model:   Text  -> uniform tanh -> uniform linear -> softmax
###           World -> uniform linear -> (x,y,z)
###  Loss:    Mean Squared Error
###           Mean Cross Entropy

sess = tf.Session()
text_dim = len(D.Train["text"][0])
world_dim = len(D.Train["world"][0])
x_t = L.placeholder(text_dim, 'text')
x_w = L.placeholder(world_dim, 'world')
y_A = L.placeholder(3, 'y_Action')
y_C = L.placeholder(21, 'y_Class')  # 20 blocks

# Model variables
W_w = L.uniform_W(world_dim, 3, 'W_w')
b_w = L.uniform_b(3, name='b_w')
W_t_h = L.uniform_W(input_dim=text_dim, name='W_t')
b_t_h = L.uniform_b(name='b_t')
W_t = L.uniform_W(output_dim=21, name='W_t')
b_t = L.uniform_b(21, 'b_t')

# Model structure
y_re = tf.matmul(x_w, W_w) + b_w

x_t_h = tf.nn.tanh(tf.matmul(x_t, W_t_h) + b_t_h)
y_sf = tf.nn.softmax(tf.matmul(x_t_h, W_t) + b_t)

# mean Cross Entropy for Softmax + MSE
loss_sf = -1 * tf.reduce_sum(tf.mul(y_C, tf.log(y_sf)))  # One prediction
loss_mse = tf.reduce_mean(tf.square(tf.sub(y_A, y_re)))  # Three predictions

def compute_loss_sf():
  return sess.run(loss_sf, feed_dict={x_t: D.Train["text"], y_C: D.Train["classes"]})
def compute_loss_mse():
  return sess.run(loss_mse, feed_dict={x_w: D.Train["world"], y_A: D.Train["actions"]})

############################# Train Model #####################################

print "Training"

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
# lr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-4, staircase=False)
# train_step = tf.train.MomentumOptimizer(lr,0.01).minimize(loss, global_step=global_step)
train_step_re = tf.train.GradientDescentOptimizer(starter_learning_rate).minimize(loss_mse)
train_step_sf = tf.train.GradientDescentOptimizer(starter_learning_rate).minimize(loss_sf)

sess.run(tf.initialize_all_variables())

print "Regression"
batches = D.minibatch([D.Train["world"], D.Train["actions"]])
oldLoss = compute_loss_mse()
for i in range(10):
  for a,b in batches:
    sess.run(train_step_re, feed_dict={x_w: a, y_A: b})
  newLoss = compute_loss_mse()
  print "%3d %10.7f  -->   %11.10f" % (i, newLoss, (oldLoss - newLoss) / oldLoss)
  if math.isnan(newLoss) or math.isinf(newLoss):
    print "Check yo gradients: ", newLoss
    sys.exit()

print "Softmax"
batches = D.minibatch([D.Train["text"], D.Train["classes"]])
oldLoss = compute_loss_sf()
for i in range(10):
  for a,b in batches:
    sess.run(train_step_sf, feed_dict={x_t: a, y_C: b})
  newLoss = compute_loss_sf()
  print "%3d %10.7f  -->   %11.10f" % (i, newLoss, (oldLoss - newLoss) / oldLoss)
  if math.isnan(newLoss) or math.isinf(newLoss):
    print "Check yo gradients: ", newLoss
    sys.exit()

############################# Predict From Model ##############################
print "Testing"
predicted_sf = sess.run(y_sf, feed_dict={x_t: D.Test["text"]})
predicted_re = sess.run(y_re, feed_dict={x_w: D.Test["world"]})

predicted_id = []
for i in range(len(predicted_re)):
  predicted_id.append([sess.run(tf.argmax(predicted_sf[i], 0))])
D.write_predictions(np.concatenate((predicted_id, predicted_re), axis=1))
