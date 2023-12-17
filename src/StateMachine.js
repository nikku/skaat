/* global console */

/**
 * @typedef { [ next: string, actor: number ] | string } StepResult
 * @typedef { (...args: any[]) => StepResult } StepFunction
 * @typedef { [ start: string, next: string, fn: StepFunction ] | [ start: string, fn: StepFunction ] | [ end: string ] } StepDefinition
 * @typedef { { verbose?: boolean; steps: StepDefinition[] } } StateMachineOptions
 * @typedef { { state: string, expectedActor: number } } StateMachineStart
 */

/**
 * @param { StateMachineOptions } options
 * @param { StateMachineStart } [start]
 */
export default function StateMachine(options, start) {

  let state = start && start.state || 'initial';
  let expectedActor = start && start.expectedActor || null;

  const verbose = options.verbose || false;

  const steps = options.steps.reduce((map, step) => {

    // default action
    if (step.length === 2) {
      const [ state, action ] = step;

      if (map[state]) {
        throw new Error(`state <${state}> definition error: default action already registered`);
      }

      map[state] = {
        action
      };

      return map;
    }

    // user action
    if (step.length === 3) {

      const [ state, next, action ] = step;

      map[state] = map[state] || {
        paths: {}
      };

      if (map[state].action) {
        throw new Error(`state <${state}> definition error: mixing default and explicit actions`);
      }

      map[state].paths[next] = action;

      return map;
    }

    // end
    if (step.length === 1) {
      const [ state ] = step;

      map[state] = {};

      return map;
    }

    throw new Error('invalid step definition');
  }, {});

  if (!steps[state]) {
    throw new Error(`state <${state}> required`);
  }

  /**
   * @param {string} nextState
   * @param {number} [actor]
   * @param {...unknown} args
   *
   * @return { [ next: string, actor: number | null ] }
   */
  function next(nextState, actor = null, ...args) {
    verbose && console.log(`next START <${ printActor(actor) }> ${state} -> ${nextState}`, ...args);

    let stateDefinition = steps[state];

    const paths = stateDefinition.paths;

    if (!paths) {
      verbose && console.error(`next ERROR no paths transitions for state ${state}`);

      throw new Error(`no paths transitions for state ${state}`);
    }

    let transition = paths[nextState];

    if (!transition) {
      verbose && console.error(`next ERROR no transition ${state} -> ${nextState}`);

      throw new Error(`no transition ${state} -> ${nextState}`);
    }

    if (actor !== expectedActor) {
      verbose && console.error(`next ERROR expected actor <${printActor(expectedActor)}>, found <${printActor(actor)}>`);

      throw new Error(`unexpected actor <${printActor(actor)}>`);
    }

    verbose && console.log(`take TRANSITION ${state} -> ${nextState}`);

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

      verbose && console.log(`take DEFAULT TRANSITION ${state}`);

      result = transition();
    }

    verbose && console.log(`next END ${state}`);

    return [ state, expectedActor ];
  }

  // api ////////////////

  this.next = next;
}


// helpers ///////////////

function printActor(actor) {
  return typeof actor === 'undefined' ? 'null' : actor;
}