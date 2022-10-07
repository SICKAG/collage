# Arrangement
An arrangement defines the layout and configuration of it's embedded fragments and is able to use the Direct Functions API to communicat with its fragments directly.
An arrangement can be a fragment itself and thus be embedded into other arrangements.

The arrangement initiates the handshake with each of its fragments to enable communication.


```mermaid
sequenceDiagram
    participant Zero
    participant Arrangement
    participant Fragment
    participant SubFragment



    Arrangement ->> Arrangement: expose
    Fragment ->> Fragment: expose
    Arrangement -->> Arrangement: A-1 listenFor(callForArrangement)
    Arrangement -->> Zero: ...callForArrangement
    Arrangement -->> Arrangement: ...listenFor(answerToCallForArrangement)
   
    Fragment -->> Fragment: A-1 listenFor(callForArrangement)
    Fragment ->> Fragment: F-1 callForArrangement()
    
    activate Fragment
        Fragment -->> Fragment: F-2. listenFor(answerToCallForArrangement)
        Fragment ->> Arrangement: F-1.1 message: call-for-arrangement
    deactivate Fragment
    
    activate Arrangement
        Arrangement ->>Arrangement: A-2 answerToCallForArrangement()
        Arrangement ->> Arrangement: A-3 connectToFragment()
        Arrangement -->> Fragment: A-3.1 <penpal> connectToChild
        Fragment -->> Arrangement: A-3.1 <penpal-response> connectToChild
        Arrangement ->> Fragment: A-4 message: answer-to-call-for-arrangement
    deactivate Arrangement
    
    activate Fragment
        Fragment ->> Fragment: F-3 connectToArrangement()
        Fragment -->> Arrangement: F-3.1 <penpal> connectToParent
        activate Arrangement
            Fragment->>Fragment: F-3.2 listenFor(reinitializeFragment)
            Arrangement->>Arrangement: A-3.2 updateContext() // direct functions
            Arrangement -->> Fragment: F-3.1 <penpal-response> connectToParent
            
            activate Fragment
                Arrangement -->> Arrangement: A-3.3 dispatchEvent(fragmentLoaded, fragmentName)
        deactivate Arrangement
                Fragment->>Fragment: F-3.3 updateContext() // branchServices
                Fragment ->> Fragment: F-3.4 reinitializeFragments()
            deactivate Fragment
        
        loop for fragment in DOM
            Fragment ->> SubFragment: F-3.4 message: reinitialize-fragment
            activate SubFragment
                SubFragment->> SubFragment: 2. callForArrangement() ...
            deactivate SubFragment
        end
    deactivate Fragment

```
