/**
 * Layer 3: Deterministic Domain Rule Verification Engine
 * Pure client-side zero-model graph algorithms for codified architectural,
 * electrical, and cyber-physical infrastructure safety standards.
 */

const MAX_EGRESS_INTERMEDIATE_ROOMS = 2;
const HIGH_OCCUPANCY_THRESHOLD = 50;
const MIN_EXITS_FOR_HIGH_OCCUPANCY = 2;

// Breadth-First-Search graph helper
function buildAdjacencyMap(elements, adjacency) {
  const adj = {};
  for (const el of elements) {
    adj[el.id] = [];
  }
  for (const [u, v] of adjacency) {
    if (!adj[u]) adj[u] = [];
    if (!adj[v]) adj[v] = [];
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj;
}

export function ruleEgress01(graph) {
  const violations = [];
  const exitIds = new Set(graph.elements.filter((e) => e.kind === 'exit' || e.attributes?.is_exit).map((e) => e.id));
  const rooms = graph.elements.filter((e) => e.kind === 'room');

  if (rooms.length === 0) return violations;
  const adj = buildAdjacencyMap(graph.elements, graph.adjacency);

  for (const room of rooms) {
    if (exitIds.has(room.id)) continue;

    const queue = [[room.id, 0]];
    const visited = new Set([room.id]);
    let foundExit = false;
    let shortestHops = Infinity;

    while (queue.length > 0) {
      const [currId, count] = queue.shift();
      if (exitIds.has(currId)) {
        foundExit = true;
        shortestHops = Math.min(shortestHops, count);
        break;
      }

      for (const neighbor of adj[currId] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const neighborElem = graph.elements.find((e) => e.id === neighbor);
          const isInterveningRoom = neighborElem && neighborElem.kind === 'room';
          queue.push([neighbor, isInterveningRoom ? count + 1 : count]);
        }
      }
    }

    if (!foundExit) {
      violations.push({
        rule_id: 'EGRESS-01',
        severity: 'critical',
        element_ids: [room.id],
        rationale: `Room '${room.label || room.id}' has no navigable exit route to an exterior egress portal.`,
        regulatory_code: 'NFPA 101 §7.5.1 / IBC §1006.2',
        remediation: 'Provide an egress doorway connecting directly to an exit corridor or exterior portal.',
      });
    } else if (shortestHops > MAX_EGRESS_INTERMEDIATE_ROOMS) {
      violations.push({
        rule_id: 'EGRESS-01',
        severity: 'high',
        element_ids: [room.id],
        rationale: `Room '${room.label || room.id}' requires traversing ${shortestHops} intermediate rooms to reach an exit (maximum permitted is ${MAX_EGRESS_INTERMEDIATE_ROOMS}).`,
        regulatory_code: 'IBC §1016.2 / NFPA 101 §7.5.2',
        remediation: `Reconfigure circulation corridors so occupants do not traverse more than ${MAX_EGRESS_INTERMEDIATE_ROOMS} intervening spaces.`,
      });
    }
  }

  return violations;
}

export function ruleEgress02(graph) {
  const violations = [];
  const totalOccupancy = graph.elements.reduce((acc, e) => acc + (parseInt(e.attributes?.occupancy) || 0), 0);
  const exitElements = graph.elements.filter((e) => e.kind === 'exit' || e.attributes?.is_exit);

  if (totalOccupancy > HIGH_OCCUPANCY_THRESHOLD && exitElements.length < MIN_EXITS_FOR_HIGH_OCCUPANCY) {
    violations.push({
      rule_id: 'EGRESS-02',
      severity: 'critical',
      element_ids: exitElements.length > 0 ? exitElements.map((e) => e.id) : ['floor_level'],
      rationale: `Total floor occupancy is ${totalOccupancy} (exceeds threshold of ${HIGH_OCCUPANCY_THRESHOLD}), but only ${exitElements.length} exit(s) are available (minimum required: ${MIN_EXITS_FOR_HIGH_OCCUPANCY}).`,
      regulatory_code: 'IBC §1006.2.1 / NFPA 101 §7.4.1',
      remediation: `Install at least ${MIN_EXITS_FOR_HIGH_OCCUPANCY - exitElements.length} independent, remotely situated fire exits.`,
    });
  }

  return violations;
}

export function ruleEgress03(graph) {
  const violations = [];
  const exitIds = new Set(graph.elements.filter((e) => e.kind === 'exit' || e.attributes?.is_exit).map((e) => e.id));
  const rooms = graph.elements.filter((e) => e.kind === 'room');
  if (exitIds.size === 0) return violations;

  const adj = buildAdjacencyMap(graph.elements, graph.adjacency);

  for (const item of rooms) {
    if (exitIds.has(item.id)) continue;
    const neighbors = adj[item.id] || [];
    const occupancy = parseInt(item.attributes?.occupancy) || 0;

    if (neighbors.length === 1 && occupancy > 25) {
      violations.push({
        rule_id: 'EGRESS-03',
        severity: 'high',
        element_ids: [item.id],
        rationale: `Dead-End Entrapment Hazard: Space '${item.label || item.id}' (occupancy: ${occupancy}) has only a single access route. Any obstruction at '${neighbors[0]}' results in complete occupant entrapment.`,
        regulatory_code: 'IBC §1020.4 / NFPA 101 §7.5.1.5',
        remediation: 'Provide a secondary independent egress door or continuous loop circulation corridor.',
      });
    }
  }

  return violations;
}

export function ruleEgress04(graph) {
  const violations = [];
  const exits = graph.elements.filter((e) => e.kind === 'exit');
  const totalOccupancy = graph.elements.reduce((acc, e) => acc + (parseInt(e.attributes?.occupancy) || 0), 0);

  for (const exitElem of exits) {
    const widthInches = parseFloat(exitElem.attributes?.clear_width_inches || 36);
    const allocatedOccupancy = totalOccupancy / Math.max(1, exits.length);
    const minRequiredWidth = allocatedOccupancy * 0.2;

    if (widthInches < minRequiredWidth && allocatedOccupancy > 150) {
      violations.push({
        rule_id: 'EGRESS-04',
        severity: 'high',
        element_ids: [exitElem.id],
        rationale: `Exit Doorway Capacity Bottleneck: Exit '${exitElem.label || exitElem.id}' has clear width ${widthInches} in, insufficient for ${Math.round(allocatedOccupancy)} occupant load (minimum required: ${minRequiredWidth.toFixed(1)} in).`,
        regulatory_code: 'IBC §1005.3.1 / NFPA 101 §7.3.3',
        remediation: `Widen exit portal or install double-leaf panic hardware exit doors providing >= ${minRequiredWidth.toFixed(1)} in.`,
      });
    }
  }

  return violations;
}

export function ruleElec01(graph) {
  const violations = [];
  const criticalLoads = graph.elements.filter(
    (e) => e.attributes?.is_critical === true || e.attributes?.criticality === 'critical'
  );

  const adj = buildAdjacencyMap(graph.elements, graph.adjacency);

  for (const load of criticalLoads) {
    const connected = adj[load.id] || [];
    const panels = graph.elements.filter((e) => connected.includes(e.id) && (e.kind === 'panel' || e.id.toLowerCase().includes('panel')));

    for (const panel of panels) {
      const panelConnections = adj[panel.id] || [];
      const sources = graph.elements.filter(
        (e) =>
          panelConnections.includes(e.id) &&
          (e.attributes?.source_type || e.id.includes('gen') || e.id.includes('grid') || e.id.includes('backup'))
      );

      const sourceTypes = new Set();
      for (const s of sources) {
        let st = s.attributes?.source_type;
        if (!st) {
          st = s.id.includes('gen') || s.id.includes('backup') ? 'backup' : 'primary';
        }
        sourceTypes.add(st);
      }

      if (sourceTypes.has('primary') && sourceTypes.has('backup')) {
        violations.push({
          rule_id: 'ELEC-01',
          severity: 'critical',
          element_ids: [load.id, panel.id, ...sources.map((s) => s.id)],
          rationale: `Critical load '${load.label || load.id}' is powered via panel '${panel.label || panel.id}' where primary utility and backup emergency feeds share a common circuit without automatic transfer switch (ATS) isolation.`,
          regulatory_code: 'NEC 700.10(B) / NFPA 110 §6.2',
          remediation: 'Install an Automatic Transfer Switch (ATS) cabinet to mechanically and electrically isolate emergency generator and normal grid feeds.',
        });
      }
    }
  }

  return violations;
}

export function ruleElec02(graph) {
  const violations = [];
  const circuits = graph.elements.filter((e) => (e.kind === 'panel' || e.kind === 'node') && 'rated_load' in (e.attributes || {}));

  for (const item of circuits) {
    const rated = parseFloat(item.attributes?.rated_load || 0);
    const current = parseFloat(item.attributes?.current_load || item.attributes?.actual_load || 0);
    if (rated > 0 && current > rated) {
      violations.push({
        rule_id: 'ELEC-02',
        severity: 'high',
        element_ids: [item.id],
        rationale: `Circuit/Panel '${item.label || item.id}' exceeds rated capacity: connected load ${current} kW/A exceeds rating ${rated} kW/A (${((current / rated) * 100).toFixed(0)}% load).`,
        regulatory_code: 'NEC 220 Branch Calculations / NFPA 70 §408',
        remediation: 'Rebalance branch circuits or upgrade breaker/feeder ampacity to prevent nuisance thermal tripping.',
      });
    }
  }

  return violations;
}

export function ruleElec03(graph) {
  const violations = [];
  const criticalLoads = graph.elements.filter(
    (e) => e.attributes?.is_critical === true || e.attributes?.criticality === 'critical'
  );
  const backupSources = graph.elements
    .filter((e) => e.attributes?.source_type === 'backup' || e.id.includes('gen') || e.id.includes('backup'))
    .map((e) => e.id);

  const adj = buildAdjacencyMap(graph.elements, graph.adjacency);

  for (const load of criticalLoads) {
    const visited = new Set([load.id]);
    const queue = [load.id];
    let hasBackup = false;

    while (queue.length > 0) {
      const curr = queue.shift();
      if (backupSources.includes(curr)) {
        hasBackup = true;
        break;
      }
      for (const nxt of adj[curr] || []) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      }
    }

    if (!hasBackup) {
      violations.push({
        rule_id: 'ELEC-03',
        severity: 'critical',
        element_ids: [load.id],
        rationale: `Unprotected Mission-Critical Load: Asset '${load.label || load.id}' is designated mission-critical but has ZERO emergency standby generator or secondary UPS feed. Utility grid failure will cause immediate blackout.`,
        regulatory_code: 'IEEE 446 §4.2 / Uptime Institute Tier III Standard',
        remediation: 'Add redundant dual-feed circuitry routed through an uninterrupted power supply (UPS) and standby generator.',
      });
    }
  }

  return violations;
}

export function ruleNet01(graph) {
  const violations = [];
  const criticalNodes = graph.elements
    .filter((e) => e.attributes?.is_critical === true || e.attributes?.criticality === 'critical')
    .map((e) => e.id);

  if (criticalNodes.length < 2) return violations;
  const adj = buildAdjacencyMap(graph.elements, graph.adjacency);
  const allNodes = graph.elements.filter((e) => ['node', 'panel', 'switch', 'router'].includes(e.kind)).map((e) => e.id);

  for (let i = 0; i < criticalNodes.length; i++) {
    for (let j = i + 1; j < criticalNodes.length; j++) {
      const src = criticalNodes[i];
      const dst = criticalNodes[j];

      const isReachableWithout = (exclude) => {
        const visited = new Set([src]);
        const queue = [src];
        while (queue.length > 0) {
          const curr = queue.shift();
          if (curr === dst) return true;
          for (const nxt of adj[curr] || []) {
            if (nxt !== exclude && !visited.has(nxt)) {
              visited.add(nxt);
              queue.push(nxt);
            }
          }
        }
        return false;
      };

      if (!isReachableWithout(null)) continue;

      for (const intermediate of allNodes) {
        if (intermediate === src || intermediate === dst) continue;
        if (!isReachableWithout(intermediate)) {
          const interElem = graph.elements.find((e) => e.id === intermediate);
          violations.push({
            rule_id: 'NET-01',
            severity: 'high',
            element_ids: [intermediate, src, dst],
            rationale: `Single Point of Failure (SPOF): Node '${interElem?.label || intermediate}' is the only communication route between critical assets '${src}' and '${dst}'.`,
            regulatory_code: 'NIST SP 800-82 / IEC 62443-3-3',
            remediation: 'Implement redundant mesh routing or a secondary ring topology backup link.',
          });
          break;
        }
      }
    }
  }

  return violations;
}

export function executeLayer3(graph) {
  const violations = [];
  if (graph.plan_type === 'electrical_diagram') {
    violations.push(...ruleElec01(graph));
    violations.push(...ruleElec02(graph));
    violations.push(...ruleElec03(graph));
  } else if (graph.plan_type === 'network_diagram') {
    violations.push(...ruleNet01(graph));
  } else {
    // Default architectural floor plan rules
    violations.push(...ruleEgress01(graph));
    violations.push(...ruleEgress02(graph));
    violations.push(...ruleEgress03(graph));
    violations.push(...ruleEgress04(graph));
  }
  return violations;
}
