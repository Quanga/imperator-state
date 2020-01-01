# IMPERATOR STATE SERVICE

## OVERVIEW

The Imperator State Service (ISS) is a micro-service module used in the Imperator IoT Blast Control Stack. Its primary role is as a state interpretation service as well as a server for the frontend applications.

ISS uses Happner-2, a RPC framework to manage communication and data across the local and any connected nodes in the system. Each instance of the system hosted on either the edge devices or cloud, are able to integrate into the mesh through websocket via a client or REST HTTP/HTTPS APIs. Server instances connect to each other as endpoints.

## STATE MANAGEMENT

#### LIVE STATE MANAGEMENT

ISS primary role is as a parser and state interpretation system for the HydraDet Blasting System. Validated packets are ingested through the input queue, routed to the parser which decrypt the packet and create the state per item.

The system has been developed primarily for edge deployment with most data handling being designed for limited cloud accessibility.

The system maintains both persisted and in-memory state. The dual persisted and memory structure reduces latency caused by slower disk access versus memory access.

#### BLAST REPORTING

As well as the management of the state, the StMS also handles Blast Events. If the state represents a blast event, the state is snapshot at the beginning of the event and again when the event end. This snapshot is persisted in a format which is used in the UI or can be converted to PDF.

## FRONTEND
### CLIENT
Using the Happner-2 Client enables the frontend to join the mesh, thereby being able to call remote methods directly as well as subcribing to events.  


## DEPLOYMENT

The Imperator Stack can either be deployed through PM2 process manager using their deployment strategy, or can be deployed through a ansible and docker workflow.

### PM2

Using the PM2 ecosystem.config.js allows the system to be rapidly deployed and updated through SSH. The host device must be set up correctly with SSH authorization to both local deployment systems as well as with github authentification to access the updated repositories.

### DOCKER

The stack now supports a docker deployment. This can be run through the `docker-compose.yml` that is supplied withing this service (to run the service in isolation) or through the main `Imperator` repository which contains the entire stack deployment.

Once deployed, the stack is manages with a `WatchTower` container which will periodically check the registry for updated containers.

### DOCUMENTS

- [API Documents](https://github.com/happner/happner-2/blob/master/docs/walkthrough/the-basics.md)
- [Development Documents](https://github.com/happner/happner-2/blob/master/docs/walkthrough/the-basics.md)
