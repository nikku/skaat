

export default function StateMachine(stepDefinitions) {

  let state = 'initial';

  let expectedActor = null;

  const steps = stepDefinitions.reduce((map, steps) => {

    if (steps.length === 2) {
      const [ state, action ] = steps;

      if (map[state]) {
        throw new Error(`state <${state}> definition error: default action already registered`);
      }

      map[state] = {
        action
      };

      return map;
    }

    if (steps.length === 3) {

      const [ state, next, action ] = steps;

      map[state] = map[state] || {
        paths: {}
      };

      if (map[state].action) {
        throw new Error(`state <${state}> definition error: mixing default and explicit actions`);
      }

      map[state].paths[next] = action;

      return map;
    }

    throw new Error('invalid step definition');
  }, {});

  if (!steps[state]) {
    throw new Error(`state <${state}> required`);
  }

  function next(nextState, actor = null, ...args) {
    console.log(`next START <${actor || 'null' }> ${state} -> ${nextState}`, ...args);

    let stateDefinition = steps[state];

    const paths = stateDefinition.paths;

    if (!paths) {
      console.error(`next ERROR no paths transitions for state ${state}`);

      throw new Error(`no paths transitions for state ${state}`);
    }

    let transition = paths[nextState];

    if (!transition) {
      console.error(`next ERROR no transition ${state} -> ${nextState}`);

      throw new Error(`no transition ${state} -> ${nextState}`);
    }

    if (actor !== expectedActor) {
      console.error(`next ERROR expected actor <${expectedActor}>, found <${actor}>`);

      throw new Error(`unexpected actor <${actor}>`);
    }

    console.log(`take TRANSITION ${state} -> ${nextState}`);

    let result = transition(actor, ...args);

    while (result) {

      let [
        nextState,
        nextActor = null
      ] = Array.isArray(result) ? result : [ result ];

      expectedActor = nextActor;
      state = nextState;

      if (state === 'end') {
        break;
      }

      stateDefinition = steps[state];

      transition = stateDefinition.action;

      if (!transition) {
        break;
      }

      console.log(`take DEFAULT TRANSITION ${state}`);

      result = transition();
    }

    console.log(`next END ${state}`);

    return [ state, expectedActor ];
  }

  // api ////////////////

  this.next = next;
}