## BLAST SERVICE

### OVERVIEW

The Blast Service handles the creation of a BlastModel object when a blast is initiated. The BlastModel is a state management class with an internal state machine to handle timing applications.

The Blast Service is a Happner-2 component and therefor uses the `$happn` injected services:

- log
- emit
- exchange

### BLASTMODEL STRUCTURE

#### SNAPSHOT

The model contains a `snapshot object` which in turn contains a `start` and `end object`.

The objects for start and end snapshots are formatted into three objects: - **active** - units with children (detonators) and are in an **ARMED** state pre-blast - **excluded** - units with children and are in a **DISARMED** state pre-blast - **inactive** - units with no children and are in a **DISARMED** on **NO_COMMUNICATION** state pre-blast.

The destinction between these states is important as the children within the inactive group will aggregate to the total number of detonators in the blast event, however they are not active in the actual event thus can be interpreted blast failure. It is alos not advisable to load these units when they are not being used.

#### LOGS

The model stores all logs between its **start** and **end** snapshots. This is to ensure a clean record of the initial state and the end state as well as all events which impacted the state.

#### FSM

The blast FSM (configs/blasts) is an xstate fsm object which handles all actions required during the blast cycle. These include handling firing aborts, ui timers etc.

The FSM can be extended to include any new events by adding actions to the fsm sections.
The `state` event is emitted by the `blastModel` and is handled within the `Blast Service`

### LISTENING EVENTS

Blast Services listens on `dataService` for a state change event:

```
dataService.on("state",
		  data => { if (data[typeId] === 0) {
			switch (data.state.operation {
                    case "firing":
                        blastService.createNewBlast(data[createdAt]);
                        break;
                    case "firing_aborted":
                        blastService.closeBlast();
                        break;
                    case "firing_complete":
                        this.currentBlast.toggleState(data);
                        break;
                    default:
                        break;
                }}})
```

It is listening for **typeId 0** - **Control Unit** - to be in the **firing state** to create and initialise a new Blast Model.

In creating the Blast Model, the service opens a new listener to the **Event Service** where it captures all **logs** into the blast Model.

These logs are recorded into the model for record as well as being a mechanism to close the blast if it receives back all the data post blast.

### EMITTING EVENTS

The primary events from the Blast Service are the **log** emitter and the **timer** emitter.

- **log emitter** emits an event log to be recorded in the event logs.
  The event is subscribed to in the **Event Service** through `$happn.event` - `log`

- **timer emitter** emits an event to be used by the fontend application. The timer emitted object contains the timer \< string \> and duration \< number > (millisecond countdown).

  <br>_There are two timers: - **firing** - the system is in a blasting state and the time left is x - **reporting** - the system has completed the firing cycle and is awaiting a return of data to update the state._

_<small>emitted timer object</small>_

```
 { timer: 'firing', duration: 0 }
```

### API

#### getBlastModel()

Will return the in-memory Blast Model
