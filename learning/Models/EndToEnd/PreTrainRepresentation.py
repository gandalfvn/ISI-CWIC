import numpy as np
import tensorflow as tf
from learning.Utils.ReadData import Data

from learning.Utils.Layer import Layers

D = Data(12006, sequence=False)
L = Layers()

input_dim = len(D.Train["text"][0])
output_dim = len(D.Train["actions"][0])

print "Converted Data"

############################# Create a Session ################################
###  Input:   1 Hot representation of the sentence (up to length 60)
###           (x,y,z) coordinates for every block in the environment (floats)
###  Output:  3 floats    (x,y,z)
###           1 int       Predicted Block ID
###  Model:   Words -> uniform tanh -> Word_Rep (100)
###           Word_Rep -> Softmax -> ID
###           [ Word_rep World ] -> uniform tanh -> Joint_Rep (100)
###           Joint_Rep -> Linear  -> (x,y,z)
###  Loss:    3 * Mean Squared Error
###           1 * Mean Cross Entropy

sess = tf.Session()
x_t = L.placeholder(input_dim, 'Text')
x_w = L.placeholder(D.world_dim, 'World')  # 20 blocks
y_A = L.placeholder(output_dim, 'Action')
y_C = L.placeholder(21, 'Class')  # 20 blocks

## Learn a word representation ##
# Words -> Hidden -> out
W_t1 = L.uniform_W(input_dim=input_dim, name='W_t1')
b_t1 = L.uniform_b(name='b_t1')

# Words + World
W_a1 = L.uniform_W(input_dim=(100 + D.world_dim), name='W_a1')
b_a1 = L.uniform_b(name='b_a1')
W_a2 = L.uniform_W(name='W_a2')
b_a2 = L.uniform_b(name='b_a2')

# Predictions
W_p1 = L.uniform_W(output_dim=21, name='W_p1')
b_p1 = L.uniform_b(dim=21, name='b_p1')

W_p2 = L.uniform_W(output_dim=output_dim, name='W_p2')
b_p2 = L.uniform_b(dim=output_dim, name='b_p2')

## Model structure  ##
# Words -> Hidden -> Word_Rep
x_t0 = tf.tanh(tf.matmul(x_t, W_t1) + b_t1)
x_t1 = tf.nn.dropout(x_t0, 0.8, seed=12122015)

# [ Word_Rep World ] -> Hidden -> Combined Rep
x_a1 = tf.tanh(tf.matmul(tf.concat(1, [x_t1, x_w]), W_a1) + b_a1)
#x_a1 = tf.nn.dropout(x_a0, 0.8, seed=12122015)

# Word Rep -> Prediction1 -> Softmax
# Use word rep to perform grounding
y_sf = tf.nn.softmax(tf.matmul(x_t1, W_p1) + b_p1)

# Combined Rep -> Prediction2 -> Regression
y_re = tf.matmul(x_a1, W_p2) + b_p2

# mean Cross Entropy for Softmax + MSE
loss_sf = -1 * tf.reduce_sum(tf.mul(y_C, tf.log(y_sf)))
loss_mse = tf.reduce_sum(tf.square(tf.sub(y_A, y_re)))

def compute_loss_sf():
  return sess.run(loss_sf, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"], y_C: D.Train["classes"]})
def compute_loss_mse():
  return sess.run(loss_mse, feed_dict={x_t: D.Train["text"], x_w: D.Train["world"], y_A: D.Train["actions"], y_C: D.Train["classes"]})

############################# Train Model #####################################

print "Training"

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
lr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
train_step_sf = tf.train.GradientDescentOptimizer(lr).minimize(loss_sf, global_step=global_step)
lr2 = tf.train.exponential_decay(0.001, global_step, 100000, 1e-6, staircase=False)
train_step_mse = tf.train.GradientDescentOptimizer(lr2).minimize(loss_mse, global_step=global_step)

sess.run(tf.initialize_all_variables())

## Create Minibatches ##
batches = D.minibatch([D.Train["text"], D.Train["world"], D.Train["actions"], D.Train["classes"]])

oldLoss_sf = compute_loss_sf()
oldLoss_mse = compute_loss_mse()
print "iter %-10s  -->   %-11s" % ("CE", "% Change")
for i in range(100):
  for (a, b, c, d) in D.scrambled(batches):
    sess.run(train_step_sf, feed_dict={x_t: a, x_w: b, y_A: c, y_C : d})

  newLoss_sf = compute_loss_sf()
  rat = (oldLoss_sf - newLoss_sf) / oldLoss_sf
  print "%3d %10.7f   -->   %11.10f" % (i, newLoss_sf, rat)
  if abs(rat) < 0.001:
    break
  oldLoss_sf = newLoss_sf


print "iter %-10s  %-10s  -->   %-11s" % ("CE","MSE", "% Change")
for i in range(100):
  for (a, b, c, d) in D.scrambled(batches):
    sess.run(train_step_mse, feed_dict={x_t: a, x_w: b, y_A: c, y_C : d})

  newLoss_sf = compute_loss_sf()
  newLoss_mse = compute_loss_mse()
  rat = (oldLoss_mse - newLoss_mse) / oldLoss_mse
  print "%3d %10.7f   %10.7f -->   %11.10f %11.10f" % (i, newLoss_sf, newLoss_mse, (oldLoss_sf - newLoss_sf) / oldLoss_sf, rat)
  if abs(rat) < 0.001:
    break
  oldLoss_sf = newLoss_sf
  oldLoss_mse = newLoss_mse


############################# Predict From Model ##############################
print "Testing"
predicted_sf = sess.run(y_sf, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"]})
predicted_re = sess.run(y_re, feed_dict={x_t: D.Test["text"], x_w: D.Test["world"]})

predicted_id = []
for i in range(len(predicted_re)):
  predicted_id.append([sess.run(tf.argmax(predicted_sf[i], 0))])
D.write_predictions(np.concatenate((predicted_id, predicted_re), axis=1))
