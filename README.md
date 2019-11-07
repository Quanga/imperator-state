# STATE SERVER

The State Server (SS) is a clusterable server module which connects to a Packet Server (PS) in the Blasting Mesh. The SS consumes packets stored in a time-series format to build the state of the connected Blasting System and emit change events to a connected client enabled user interface.

The SS uses Happner-2, a RPC framework (Remote procedure call) to manage communication and data across itself and any connected mesh nodes in the system. Each instance of the system (SS and PS) hosted on either the edge devices or cloud, are able to integrate into the mesh through websocket via a client or REST HTTP/HTTPS APIs. Server instances connect to each other as endpoints.

### PRIMARY APPLICATION

The SS is a parser and state data management system for the Blasting Mesh. Validated packets are ingested through the input queue, passed to the parsers which decrypt the packet and create the state per item. This state object is compared against the persisted state and if certain criteria is met, will update the current state. This state is processed into both a live data model, as well as a persisted data model in case of power outages or other interruptions. The dual memory and persisted structure reduces latency caused my slower disk access versus memory access. Persistence is handled asynchronously to ensure no blocking of the system.
As well as the management of the state, the StMS also handles Blast Events. If the state represents a blast event, the state is snapshot at the beginning of the event and again when the event end. This snapshot is persisted in a format which is used in the UI or can be converted to PDF.

### DEPLOYMENT

As the system is a mesh, management of security is of highest priority. All deployment is handled through PM2 ssh key deployment management. Its process management and environment variables on either edge or cloud application are handled within PM2. All system configuration is controlled through environment variables which are injected into the PM2 process.
