import math
import numpy as np


class Data:
  @staticmethod
  def onehot(num, dim):
    """
    Creates an empty vector of dimentionality dim with a single unit activated
    :param dim: dimentionality of the vector
    :param num: which dimension should be turned on
    """
    v = [0] * dim
    v[num] = 1
    return v

  @staticmethod
  def numbers(mat):
    """
    Convertes one hot vectors into a number based on the index
    :param mat: Input one hot vectors
    """
    num = []
    for vec in mat:
      n = 0
      for v in vec:
        if v == 1:
          num.append([n])
          break
        n += 1
    return np.array(num)

  @staticmethod
  def minibatch(arrays, batch_size=16):
    """
    Creates Minibatches of 16 data points
    :param arrays:  a list of datasets (train, test, ... )
    :param batch_size: Number of data points per batch
    """
    num_batches = len(arrays[0]) / batch_size
    minibatches = []
    for i in range(num_batches):
      minibatches.append([])
      for array in arrays:
        minibatches[len(minibatches)-1].append(array[i * batch_size:(i + 1) * batch_size])
    return minibatches

  @staticmethod
  def norm(vec, mu, sig):
    """
      Tom Paine:
      also, if you actually care about this regression being good
      I would suggest normalizing the input in the following way
      for each dimension, subtract its mean over the dataset
      and divide by (its std over the dataset + 1e-6)
      :param vec:   Original vector
      :param mu:    Mean
      :param sig:   Standard Deviation
    """
    nvec = []
    for i in range(len(vec)):
      nvec.append((float(vec[i]) - mu[i]) / sig[i])
    return nvec

  def __init__(self, maxlines=1000000, separate=True, onehot=True):
    ## Build Vocabulary ##
    vocab = {"UNK": 0}
    count = 1
    for line in open("Data/source.txt", 'r'):
      for word in line.split()[:len(line.split()) - 57]:
        if word not in vocab:
          vocab[word] = count
          count += 1

    longest_sentence = 61
    vocabsize = len(vocab)
    unk = [0] * len(vocab)
    unk[0] = 1

    print "Created Vocabulary: ", vocabsize
    ## Read Training Data ##

    count = 0
    ## Compute mean/std per dimension ##
    all_locations = [[]] * 57
    mean_world = []
    std_dev = []
    for line in open("Data/source.txt", 'r'):
      line = line.split()
      for i in range(57):
        all_locations[i].append(float(line[len(line) - 57 + i]))
    for i in range(57):
      mean_world.append(sum(all_locations[i]) / len(all_locations[i]))
      std_dev.append(math.sqrt(sum([(v - mean_world[i]) ** 2 for v in all_locations[i]]) / len(all_locations[i])))

    locations = []
    utterances = []
    for line in open("Data/source.txt", 'r'):
      if count < maxlines:
        line = line.split()
        world = line[len(line) - 57:]
        words = line[:len(line) - 57]
        representation = []
        for i in range(longest_sentence):
          if i < len(words):
            representation.extend(self.onehot(vocab[words[i]], len(vocab)))
          else:
            representation.extend(unk)
        # world = self.norm(world, meanWorld, stdDev)
        utterances.append(representation)
        locations.append(world)
        count += 1
      else:
        break

    actions = []
    classes = []
    count = 0
    for line in open("Data/target.txt", 'r'):
      if count < maxlines:
        line = line.split()
        actions.append([float(v) for v in line[1:4]])
        classes.append(self.onehot(int(line[0]), 21))
        count += 1
      else:
        break

    print "Read Train: ", len(locations)

    ## Read Test Data ## 

    locations_test = []
    utterances_test = []
    for line in open("Data/source.orig.txt", 'r'):
      line = line.split()
      world = [float(v) for v in line[len(line) - 57:]]
      words = line[:len(line) - 57]
      representation = []
      for i in range(longest_sentence):
        if i < len(words):
          representation.extend(self.onehot(vocab[words[i]], len(vocab)))
        else:
          representation.extend(unk)
      utterances_test.append(representation)
      locations_test.append(world)

    actions_test = []
    classes_test = []
    for line in open("Data/target.orig.txt", 'r'):
      line = line.split()
      actions_test.append([float(v) for v in line[1:4]])
      classes_test.append(self.onehot(int(line[0]), 21))

    print "Read Test: ", len(locations_test)

    self.Train = {}
    self.Test = {}
    if onehot and separate:
      self.Train["text"] = np.array(utterances)
      self.Train["world"] = np.array(locations)
      self.Train["classes"] = np.array(classes)
      self.Train["actions"] = np.array(actions)

      self.Test["text"] = np.array(utterances_test)
      self.Test["world"] = np.array(locations_test)
      self.Test["classes"] = np.array(classes_test)
      self.Test["actions"] = np.array(actions_test)
    elif onehot and not separate:
      self.Train["input"] = np.concatenate((np.array(utterances), np.array(locations)), axis=1)
      self.Train["output"] = np.concatenate((np.array(classes), np.array(actions)), axis=1)

      self.Test["input"] = np.concatenate((np.array(utterances_test), np.array(locations_test)), axis=1)
      self.Test["output"] = np.concatenate((np.array(classes_test), np.array(actions_test)), axis=1)
    elif not onehot and not separate:
      self.Train["input"] = np.concatenate((np.array(utterances), np.array(locations)), axis=1)
      self.Train["output"] = np.concatenate((self.numbers(np.array(classes)), np.array(actions)), axis=1)

      self.Test["input"] = np.concatenate((np.array(utterances_test), np.array(locations_test)), axis=1)
      self.Test["output"] = np.concatenate((self.numbers(np.array(classes_test)), np.array(actions_test)), axis=1)
    else:
      print "Fuck you"

    print "Converted Data"
