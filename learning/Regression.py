import numpy as np
import tensorflow as tf
import math
import sys
from ReadData import Data
from Layer import Layers
np.set_printoptions(threshold=np.nan)

D = Data(10000, separate=False, onehot=False)
L = Layers()

X_train = D.Train["input"]
y_train = D.Train["output"]

X_test = D.Test["input"]
y_test = D.Test["output"]

print "Read Data"

############################# Create a Session ################################
sess = tf.Session()
input_dim = len(X_train[0])
output_dim = len(y_train[0])

x = tf.placeholder("float", shape=[None, input_dim], name='input')
y_ = tf.placeholder("float", shape=[None, output_dim], name='output')

# Model variables
W = L.uniform_W(input_dim, name='W')
b = L.uniform_b(name='b')
W_o = L.uniform_W(output_dim=output_dim, name='W_o')
b_o = L.uniform_b(output_dim, 'b_o')

# Model structure
h = tf.nn.tanh(tf.matmul(x, W) + b)
y = tf.matmul(h, W_o) + b_o

# MSE = 1/N Sum (y - y')^2
loss = tf.reduce_mean(tf.square(tf.sub(y_, y)))

############################# Train Model #####################################

print "Training"

merged_summary_op = tf.merge_all_summaries()
summary_writer = tf.train.SummaryWriter('/tmp/summary', sess.graph_def)

global_step = tf.Variable(0, trainable=False)

starter_learning_rate = 0.01
# lr = tf.train.exponential_decay(starter_learning_rate, global_step, 100000, 1e-6, staircase=False)
# train_step = tf.train.MomentumOptimizer(lr,0.01).minimize(loss, global_step=global_step)
train_step = tf.train.GradientDescentOptimizer(starter_learning_rate).minimize(loss)

sess.run(tf.initialize_all_variables())

## Create Minibatches ##
batches = D.minibatch([X_train, y_train])

## Train for 10 Epochs ##
print "Regression"
oldLoss = sess.run(loss, feed_dict={x: X_train, y_: y_train})
for i in range(10):
  for (a, b) in batches:
    sess.run(train_step, feed_dict={x: a, y_: b})

  newLoss = sess.run(loss, feed_dict={x: X_train, y_: y_train})
  print "%3d %10.7f  -->   %11.10f" % (i, newLoss, (oldLoss - newLoss) / oldLoss)
  if math.isnan(newLoss) or math.isinf(newLoss):
    print "Check yo gradients: ", newLoss
    sys.exit()

############################# Predict From Model ##############################
print "Testing"
predicted_re = sess.run(y, feed_dict={x: X_test})

out = open("predictions.txt", 'w')
print len(predicted_re)
for i in range(len(predicted_re)):
  out.write("%s\n" % str(predicted_re[i, :]))

out.close()
