import tensorflow as tf
import math


class Layers:
  """
  Helper class for quickly creating NN layers with differen initializations
  """

  def normal_W(self, input_dim=100, output_dim=100, name='Hidden'):
    return tf.Variable(tf.random_normal([input_dim, output_dim], stddev=1.0 / math.sqrt(input_dim)), name=name)
  def normal_b(self, dim=100, name='B'):
    return tf.Variable(tf.random_normal([dim], stddev=1.0 / math.sqrt(dim)), name=name)

  def uniform_W(self, input_dim=100, output_dim=100, name="Hidden"):
    return tf.Variable(tf.random_uniform([input_dim, output_dim], minval=-0.05, maxval=0.05), name=name)
  def uniform_b(self, dim=100, name="B"):
    return tf.Variable(tf.random_uniform([dim], minval=-0.05, maxval=0.05), name=name)

  def placeholder(self, dim, name):
    return tf.placeholder("float", shape=[None, dim], name=name)
