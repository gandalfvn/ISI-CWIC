import math
import sys
import numpy as np
import tensorflow as tf
from ReadData import Data
from Layer import Layers

D = Data(10000)
L = Layers()

input_dim = len(D.Train["text"][0])
output_dim = len(D.Train["actions"][0])

print "Converted Data"

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###           (x,y,z) coordinates for every block in the environment (floats)
###  Output:  3 floats    (x,y,z)
###           1 int       Predicted Block ID
###  Model:   Words -> uniform tanh -> uniform tanh -> 100
###           [ Word_rep World ] -> uniform tanh -> uniform tanh -> 100
###           Joint_Rep -> Softmax -> ID
###           Joint_Rep -> Linear  -> (x,y,z)
###  Loss:    3 * Mean Squared Error
###           1 * Mean Cross Entropy

sess = tf.Session()
x_t = L.placeholder(input_dim, 'Text')
x_w = L.placeholder(57, 'World')  # 20 blocks
y_A = L.placeholder(output_dim, 'Action')
y_C = L.placeholder(21, 'Class')  # 20 blocks

## Learn a word representation ##
# Words -> Hidden -> Hidden -> out
W_t1 = L.uniform_W(input_dim=input_dim, name='W_t1')
b_t1 = L.uniform_b(name='b_t1')
W_t2 = L.uniform_W(name='W_t2')
b_t2 = L.uniform_b(name='b_t2')

# Words + World
W_a1 = L.uniform_W(input_dim=157, name='W_a1')
b_a1 = L.uniform_b(name='b_a1')
W_a2 = L.uniform_W(name='W_a2')
b_a2 = L.uniform_b(name='b_a2')

# Predictions
W_p1 = L.uniform_W(output_dim=21, name='W_p1')
b_p1 = L.uniform_b(dim=21, name='b_p1')

W_p2 = L.uniform_W(output_dim=output_dim, name='W_p2')
b_p2 = L.uniform_b(dim=output_dim, name='b_p2')

## Model structure  ##
# Words -> Hidden -> Hidden -> Word_Rep
x_t1 = tf.tanh(tf.matmul(x_t, W_t1) + b_t1)
x_t2 = tf.tanh(tf.matmul(x_t1, W_t2) + b_t2)

# [ Word_Rep World ] -> Hidden -> Hidden -> Combined Rep
x_a1 = tf.tanh(tf.matmul(tf.concat(1, [x_t2, x_w]), W_a1) + b_a1)
x_a2 = tf.tanh(tf.matmul(x_a1, W_a2) + b_a2)

# Combined Rep -> Prediction1 -> Softmax
y_sf = tf.nn.softmax(tf.matmul(x_a2, W_p1) + b_p1)

# Combined Rep -> Prediction2 -> Regression
y_re = tf.matmul(x_a2, W_p2) + b_p2

# mean Cross Entropy for Softmax + MSE
loss_sf = -1 * tf.reduce_mean(tf.mul(y_C, tf.log(y_sf)))
loss_mse = 3 * tf.reduce_mean(tf.square(tf.sub(y_A, y_re)))
loss = loss_sf + loss_mse

def compute_loss():
  return sess.run(loss, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"], y_C: D.Train["classes"]})
def compute_loss_sf():
  return sess.run(loss_sf, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"], y_C: D.Train["classes"]})
def compute_loss_mse():
  return sess.run(loss_mse, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"], y_C: D.Train["classes"]})

############################# Train Model #####################################

print "Training"

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.1
lr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step = tf.train.MomentumOptimizer(lr, 0.01).minimize(loss, global_step=global_step)

sess.run(tf.initialize_all_variables())

## Create Minibatches ##
batches = D.minibatch([D.Train["text"], D.Train["world"], D.Train["actions"], D.Train["classes"]])

oldLoss = compute_loss()
oldLoss_sf = compute_loss_sf()
oldLoss_mse = compute_loss_mse()
print "iter %-10s  %-10s  %-10s   -->   %-11s" % ("Loss", "Mean CE", "MSE", "% Change")
for i in range(10):
  for (a, b, c, d) in batches:
    sess.run(train_step, feed_dict={x_t: a, x_w: b, y_A: c, y_C : d})

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
predicted_sf = sess.run(y_sf, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"]})
predicted_re = sess.run(y_re, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"]})

out = open("predictions.txt", 'w')
print len(predicted_re)
np.set_printoptions(suppress=True)
for i in range(len(predicted_re)):
  out.write("%s %s\n" % (sess.run(tf.argmax(predicted_sf[i], 0)), str(predicted_re[i, :])))

out.close()
print "Test loss ", sess.run(loss, feed_dict={x_t: D.Test["text"],
                                              x_w: D.Test["world"], y_A: D.Test["actions"], y_C: D.Test["classes"]})
