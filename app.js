const express = require("express");

const app = express();
app.use(express.json());

// Product weights
const centers = {
  C1: { A: 3, B: 2, C: 8 },
  C2: { D: 12, E: 25, F: 15 },
  C3: { G: 0.5, H: 1, I: 2 },
};

// Distances between locations
const distances = {
  "C1-L1": 3,
  "L1-C1": 3,
  "L1-C3": 2,
  "C2-L1": 2.5,
  "C2-C1": 4,
  "C1-C2": 4,
  "C2-C3": 3,
  "C3-L1": 2,
  "L1-C2": 2.5,
};

// Cost calculation function
const calculateCost = (weight, distance) => {
  let cost = 10 * Math.min(weight, 5) * distance; // First 5 kg at 10/unit
  if (weight > 5) {
    cost += 8 * (weight - 5) * distance; // Additional weight at 8/unit
  }
  return cost;
};

// Function to determine the minimum cost delivery
const findMinimumDeliveryCost = (order) => {
  let centerWeights = { C1: 0, C2: 0, C3: 0 };
  for (let center in centers) {
    for (let product in centers[center]) {
      if (order[product]) {
        centerWeights[center] += centers[center][product] * order[product];
      }
    }
  }

  let activeCenters = Object.keys(centerWeights).filter(c => centerWeights[c] > 0);
  let possibleRoutes = [];

  const evaluateRoute = (startCenter, pickups) => {
    let totalCost = 0;
    let currentWeight = 0;
    let currentLocation = "L1";

    let travelDistance = distances[`L1-${startCenter}`] || distances[`${startCenter}-L1`];
    if (travelDistance) {
      totalCost += calculateCost(0, travelDistance);
    }
    currentLocation = startCenter;
    currentWeight += centerWeights[startCenter];

    for (let pickup of pickups) {
      let travelDistance = distances[`${currentLocation}-${pickup}`] || distances[`${pickup}-${currentLocation}`];
      if (!travelDistance) continue;
      totalCost += calculateCost(currentWeight, travelDistance);
      currentLocation = pickup;
      currentWeight += centerWeights[pickup];
    }

    let finalDistance = distances[`${currentLocation}-L1`] || distances[`L1-${currentLocation}`];
    if (finalDistance) {
      totalCost += calculateCost(currentWeight, finalDistance);
      possibleRoutes.push(totalCost);
    }
  };

  if (activeCenters.length === 1) {
    let center = activeCenters[0];
    possibleRoutes.push(calculateCost(centerWeights[center], distances[`${center}-L1`]));
  } else {
    for (let startCenter of activeCenters) {
      let remainingCenters = activeCenters.filter(c => c !== startCenter);
      let permutations = generatePermutations(remainingCenters);
      permutations.forEach(route => evaluateRoute(startCenter, route));
    }
  }

  return { minCost: possibleRoutes.length > 0 ? Math.min(...possibleRoutes) : "No valid route" };
};

const generatePermutations = (arr) => {
  if (arr.length === 0) return [[]];
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    let rest = generatePermutations(arr.slice(0, i).concat(arr.slice(i + 1)));
    rest.forEach(r => result.push([arr[i], ...r]));
  }
  return result;
};

app.post("/calculate-cost", (req, res) => {
  const order = req.body;
  const result = findMinimumDeliveryCost(order);
  res.json(result);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
