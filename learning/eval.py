import gzip
import json
import math
import sys

from nltk.tokenize import TreebankWordTokenizer

stop = set(["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't",
            "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
            "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
            "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how",
            "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
            "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
            "only", "or", "other", "ought", "our", "ours	ourselves", "out", "over", "own", "same", "shan't", "she",
            "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the",
            "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
            "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
            "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
            "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
            "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",".",",",
            "block","box",";"])


def diff(x, y):
  return math.sqrt((x[0] - y[0])**2 + (x[1] - y[1])**2 + (x[2] - y[2])**2) / 0.1524

T = []
O = []
C = {}
Cc = {}
for line in gzip.open("Data/logos/Dev.input.orig.json.gz", 'r'):
  j = json.loads(line)
  t = TreebankWordTokenizer().tokenize(j["text"])
  T.append(t)
  O.append(j["text"])
  for word in t:
    if word not in stop:
      Cc[word] = 0
      C[word] = 0

G = []
for line in gzip.open("Data/logos/Dev.output.orig.json.gz", 'r'):
  j = json.loads(line)
  G.append((j["id"], j["loc"]))

S = []
for line in open(sys.argv[1] + 'human.predictions.txt', 'r'):
  line = line.replace("[", "").replace("]", "").split()
  S.append((int(float(line[0])), [float(v) for v in line[1:4]]))

print len(G), len(S)

grounding = 0
for i in range(len(G)):
  if G[i][0] == (S[i][0] + 1):
    grounding += 1

print "Grounding: %-5.2f" % (100.0 * grounding / len(G))

err = 0.0
errs = []
for i in range(len(G)):
  errs.append(diff(G[i][1], S[i][1]))

errs.sort()
print "Error: %-9.2f  %-9.2f" % (sum(errs)*0.1524, sum(errs)/len(G))
print "Median: %9.2f" % (errs[len(errs)/2])
print "Min/Max: %9.2f  %9.2f" % (errs[0], errs[len(errs)-1])

## Verbose By Words ##
Oe = []
for i in range(len(G)):
  d = diff(G[i][1], S[i][1])
  for word in T[i]:
    if word not in stop:
      C[word] += d
      Cc[word] += 1
  Oe.append(d)


print "\nWords and normalized error"
V = [(C[w]/Cc[w],w) for w in C]
V.sort()
V.reverse()
for count, w in V[:20]:
  print "%-30s  %-10.2f" % (w,count)
print "..."
for count, w in V[len(V)-20:]:
  print "%-30s  %-10.2f" % (w,count)


print "\nby length"
L = {}
Lc = {}
for i in range(len(G)):
  l = str(len(T[i]))
  if l not in L:
    L[l] = 0
    Lc[l] = 0
  L[l] += diff(G[i][1], S[i][1])
  Lc[l] += 1.0

ind = [int(index) for index in L]
ind.sort()
for index in ind:
  print "%-5d   %-7.2f " % (index, L[str(index)]/Lc[str(index)])


print "\nSentences"
V = [(Oe[i],O[i]) for i in range(len(G))]
V.sort()
for err,txt in V[:10]:
  print "%-5f %s" % (err, txt)
print "..."
for err,txt in V[len(V) - 10:]:
  print "%-5f %s" % (err, txt)
