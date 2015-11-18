import numpy as np
import tensorflow as tf
import math
import sys
from ReadData import Data
np.set_printoptions(threshold=np.nan)

D = Data(10000)
X_train = np.concatenate((D.Train["text"], D.Train["world"]), axis=1)
y_actiontrain = D.Train["actions"]
y_classtrain = D.Train["classes"]

X_test = np.concatenate((D.Test["text"], D.Test["world"]), axis=1)
y_actiontest = D.Test["actions"]
y_classtest = D.Test["classes"]

input_dim = len(X_train[0])
output_dim = len(y_actiontrain[0])

print "Read Data"

############################# Create a Session ################################
sess = tf.Session()
x = tf.placeholder("float", shape=[None, input_dim], name='x')
y_A = tf.placeholder("float", shape=[None, output_dim], name='y_Action')
y_C = tf.placeholder("float", shape=[None, 21], name='y_Class')  # 20 blocks

# Model variables with hidden layers initialized uniformly
W1 = tf.Variable(tf.random_uniform([input_dim, output_dim], minval=-0.05, maxval=0.05), name='W1')
b1 = tf.Variable(tf.random_uniform([output_dim], minval=-0.05, maxval=0.05), name='b1')
W2 = tf.Variable(tf.random_uniform([input_dim, 21], minval=-0.05, maxval=0.05), name='W2')
b2 = tf.Variable(tf.random_uniform([21], minval=-0.05, maxval=0.05), name='b2')

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
  return sess.run(loss, feed_dict={x: X_train, y_A: y_actiontrain, y_C: y_classtrain})
def compute_loss_sf():
  return sess.run(loss_sf, feed_dict={x: X_train, y_A: y_actiontrain, y_C: y_classtrain})
def compute_loss_mse():
  return sess.run(loss_mse, feed_dict={x: X_train, y_A: y_actiontrain, y_C: y_classtrain})

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
num_batches = 16
batch_size = len(X_train) / num_batches
batches = []
for i in range(num_batches):
  batches.append((X_train[i * batch_size:(i + 1) * batch_size],
                  y_actiontrain[i * batch_size:(i + 1) * batch_size],
                  y_classtrain[i * batch_size:(i + 1) * batch_size]))


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
predicted_sf = sess.run(y_sf, feed_dict={x: X_test})
predicted_re = sess.run(y_re, feed_dict={x: X_test})

out = open("predictions.txt", 'w')
print len(predicted_re)
np.set_printoptions(suppress=True)
for i in range(len(predicted_re)):
  out.write("%s %s\n" % (sess.run(tf.argmax(predicted_sf[i], 0)), str(predicted_re[i, :])))

out.close()
print "Test loss ", sess.run(loss, feed_dict={x: X_test, y_A: y_actiontest, y_C: y_classtest})
