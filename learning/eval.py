import gzip,json
def diff(x, y):
  return abs(x[0] - y[0]) + abs(x[1] - y[1]) + abs(x[2] - y[2])


G = []
for line in gzip.open("Data/logos/Dev.output.orig.json.gz", 'r'):
  j = json.loads(line)
  G.append((j["id"], j["loc"]))

S = []
for line in open('out/human.predictions.txt', 'r'):
  line = line.replace("[", "").replace("]", "").split()
  S.append((int(float(line[0])), [float(v) for v in line[1:4]]))

print len(G), len(S)

grounding = 0
for i in range(len(G)):
  if G[i][0] == S[i][0]:
    grounding += 1

print "Grounding: ", 1.0 * grounding / len(G)

err = 0.0
for i in range(len(G)):
  err += diff(G[i][1], S[i][1])

print "Error: ", err
