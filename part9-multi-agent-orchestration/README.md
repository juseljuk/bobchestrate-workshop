# Part 9: Multi-Agent Orchestration & Workflows

<p align="center">
  <img src="bobchestrate_part9.png" alt="Bobchestrate - Setup" width="700">
</p>

**Duration**: 30 minutes

**Difficulty**: Advanced

**Note**: This is a standalone advanced exercise that can be completed independently of earlier parts.

## Overview

In this lesson, you'll learn how to build sophisticated multi-agent systems where specialized agents work together to solve complex tasks. You'll create agent hierarchies, implement routing logic, and orchestrate workflows across multiple agents.

This part introduces a complete **travel planning system** as an advanced example of multi-agent orchestration. Unlike the customer support system built in earlier parts, this is a self-contained exercise demonstrating advanced patterns.

### What You'll Learn

- When and why to use multiple agents
- Creating specialized agents for specific domains
- Building agent hierarchies (parent-child relationships)
- Implementing intelligent routing between agents
- Managing context and handoffs
- Best practices for multi-agent systems

### What You'll Build

**Travel Planning System** with multiple specialized agents:

- **Travel Concierge** (parent) - Routes requests to specialists
- **Flight Specialist** - Handles flight bookings
- **Hotel Specialist** - Manages accommodation
- **Activity Planner** - Suggests local activities
- **Budget Advisor** - Provides cost analysis

---

## Why Multi-Agent Systems?

### Single Agent vs Multi-Agent

**Single Agent Approach:**
```
Customer Support Agent
├── 50+ tools
├── 10+ knowledge bases
├── Complex instructions (1000+ lines)
└── Handles everything
```

**Problems:**

- ❌ Overwhelming complexity
- ❌ Difficult to maintain
- ❌ Poor performance on specialized tasks
- ❌ Hard to test and debug

**Multi-Agent Approach:**
```
Orchestrator Agent
├── Order Specialist (5 tools, focused instructions)
├── Billing Specialist (3 tools, focused instructions)
├── Technical Support (8 tools, focused instructions)
└── Escalation Handler (2 tools, focused instructions)
```

**Benefits:**

- ✅ Clear separation of concerns
- ✅ Easier to maintain and update
- ✅ Better performance on specialized tasks
- ✅ Simpler testing and debugging
- ✅ Reusable specialists across systems

### When to Use Multi-Agent Systems

| Use Multi-Agent When... | Use Single Agent When... |
|-------------------------|--------------------------|
| Domain has distinct specializations | Task is simple and focused |
| Need expert-level performance | General knowledge is sufficient |
| System will grow over time | Requirements are stable |
| Multiple teams own different parts | Single team owns everything |
| Need to reuse specialists | Agent is purpose-built |

---

## Part 1: Understanding Agent Hierarchies

### Agent Roles

**1. Orchestrator (Parent) Agent**

- Routes requests to appropriate specialists
- Manages overall conversation flow
- Synthesizes responses from multiple agents
- Handles general queries

**2. Specialist (Child) Agents**

- Deep expertise in specific domain
- Focused tools and knowledge
- Clear, specific instructions
- Return to orchestrator when done

### Routing Strategies

**1. Description-Based Routing**
The orchestrator uses agent descriptions to decide routing:

```yaml
# Orchestrator sees these descriptions
collaborators:
  - flight_specialist  # "Handles flight searches, bookings, and changes"
  - hotel_specialist   # "Manages hotel reservations and accommodations"
```

**2. Instruction-Based Routing**
Explicit routing logic in orchestrator instructions:

```yaml
instructions: |
  When user asks about flights:
  - Route to flight_specialist

  When user asks about hotels:
  - Route to hotel_specialist

  When user needs both:
  - Route to flight_specialist first
  - Then route to hotel_specialist
  - Synthesize both responses
```

**3. Tool-Based Routing (Supervisory Pattern)**
The orchestrator acts as a supervisor without domain-specific tools, delegating to specialists who have the actual tools:

```yaml
# Orchestrator Agent (Supervisor)
# - Has NO flight/hotel/activity tools
# - Only has access to specialist agents as collaborators
# - Analyzes user request and delegates to appropriate specialist

# Flight Specialist Agent
# - HAS flight search and booking tools
# - Handles all flight-related operations

# Hotel Specialist Agent
# - HAS hotel search and booking tools
# - Handles all hotel-related operations
```

**Why this works:**

- Orchestrator recognizes it lacks the tools needed for the task
- It must delegate to a specialist agent that has those tools
- This creates natural routing based on capability boundaries
- Prevents the orchestrator from trying to handle domain-specific tasks directly

---

## Part 2: Building Specialist Agents

### Step 1: Create Flight Specialist

[Download](./flight-specialist-agent.yaml) example `flight-specialist-agent.yaml` or ask Bob for it (look example prompt below the example yaml). **HINT**: you should ask Bob. It will create a better than the simple example 🤓 And it's only around 0.3 bobcoins 🪙

```yaml
spec_version: v1
kind: native
name: flight_specialist
title: Flight Booking Specialist
description: Expert in flight searches, bookings, changes, and cancellations. Handles all flight-related queries including availability, pricing, and itinerary modifications.

instructions: |
  You are a flight booking specialist with deep expertise in air travel.
  
  Your capabilities:
  - Search for flights based on dates, destinations, preferences
  - Provide detailed flight information (times, prices, airlines)
  - Handle booking requests
  - Process flight changes and cancellations
  - Explain baggage policies and fees
  
  Guidelines:
  - Always ask for essential details: origin, destination, dates, passengers
  - Present options clearly with prices and durations
  - Highlight best value and most convenient options
  - Explain any restrictions or fees upfront
  - Confirm all details before booking
  
  When you've completed the user's flight-related request:
  - Summarize what was accomplished
  - Ask if they need anything else flight-related
  - If they need other travel services (hotels, activities), let them know
    you'll hand back to the travel concierge
  
  Response format:
  - Be concise but complete
  - Use bullet points for options
  - Include all relevant details (times, prices, airlines)
  - End with clear next steps

tools:
  - search_flights
  - book_flight
  - modify_flight
  - cancel_flight

llm: groq/openai/gpt-oss-120b
```

**💡 Ask Bob:**
```
Bob, create a flight_specialist_agent.yaml file with focused instructions
for handling flight bookings and searches.
```
When Bob is finished, you will have a new agent file stored to your agents directory. Have a look what Bob created for you. Quite professional, isn't it? With real guidelines and tool placeholder. We create the tools a bit later.

### Step 2: Create Hotel Specialist

[Download](./hotel-specialist-agent.yaml) example `hotel-specialist-agent.yaml` or ask Bob for it. At this point, you should have some idea how to prompt this agent 😉 You can try several times until you are satisfied with the result.

```yaml
spec_version: v1
kind: native
name: hotel_specialist
title: Hotel Booking Specialist
description: Expert in hotel accommodations, reservations, and lodging options. Handles hotel searches, bookings, modifications, and provides recommendations based on preferences and budget.

instructions: |
  You are a hotel booking specialist with extensive knowledge of accommodations.
  
  Your capabilities:
  - Search hotels by location, dates, and preferences
  - Provide detailed hotel information (amenities, ratings, prices)
  - Handle reservation requests
  - Process booking modifications and cancellations
  - Recommend hotels based on budget and needs
  
  Guidelines:
  - Ask for: location, check-in/out dates, guests, budget, preferences
  - Present 3-5 options with key details
  - Highlight amenities that match user preferences
  - Explain cancellation policies clearly
  - Confirm all details before booking
  
  When you've completed the user's hotel-related request:
  - Summarize the booking or recommendations
  - Ask if they need anything else hotel-related
  - If they need other travel services, indicate you'll return to
    the travel concierge
  
  Response format:
  - Clear hotel names and locations
  - Price per night and total cost
  - Key amenities (WiFi, breakfast, parking, etc.)
  - Guest ratings if available
  - Cancellation policy summary

tools:
  - search_hotels
  - book_hotel
  - modify_hotel_booking
  - cancel_hotel_booking

llm: groq/openai/gpt-oss-120b
```

### Step 3: Create Activity Planner

[Download](./activity-planner-agent.yaml) example `activity-planner-agent.yaml` or ask Bob for it.

```yaml
spec_version: v1
kind: native
name: activity_planner
title: Local Activity Specialist
description: Expert in local attractions, activities, tours, and experiences. Provides personalized recommendations for things to do based on interests, location, and travel dates.

instructions: |
  You are a local activity and experience specialist.
  
  Your capabilities:
  - Suggest activities based on location and interests
  - Provide details on tours, attractions, and experiences
  - Recommend restaurants and local cuisine
  - Suggest itineraries for different trip lengths
  - Provide insider tips and local knowledge
  
  Guidelines:
  - Ask about: destination, travel dates, interests, group size
  - Tailor suggestions to user preferences (adventure, culture, food, etc.)
  - Include practical details (duration, cost, booking requirements)
  - Suggest a mix of popular and off-the-beaten-path options
  - Consider timing and logistics
  
  When you've provided activity recommendations:
  - Summarize the suggested itinerary
  - Offer to provide more details on specific activities
  - If they need other travel services, indicate you'll return to
    the travel concierge
  
  Response format:
  - Activity name and brief description
  - Duration and best time to visit
  - Approximate cost
  - Why it's recommended for them
  - Booking/reservation requirements

tools:
  - search_activities
  - get_activity_details
  - search_restaurants
  - create_itinerary

llm: groq/openai/gpt-oss-120b
```

### Step 4: Create Budget Advisor

[Download](./budget-advisor-agent.yaml) example `budget-advisor-agent.yaml` or ask Bob for it. HINT: ever considered to ask Bob for a promt to create a certain type of an agent? Just thinking aloud here 😉

```yaml
spec_version: v1
kind: native
name: budget_advisor
title: Travel Budget Specialist
description: Expert in travel cost analysis, budget planning, and money-saving strategies. Helps travelers understand costs, find deals, and optimize their travel budget.

instructions: |
  You are a travel budget and cost analysis specialist.
  
  Your capabilities:
  - Analyze total trip costs (flights, hotels, activities, meals)
  - Suggest budget-friendly alternatives
  - Identify money-saving opportunities
  - Compare costs across different options
  - Provide budget breakdowns and forecasts
  
  Guidelines:
  - Ask about: total budget, trip duration, priorities
  - Break down costs by category
  - Highlight where most money is spent
  - Suggest specific ways to save money
  - Be realistic about costs
  
  When you've completed the budget analysis:
  - Provide clear cost breakdown
  - Highlight savings opportunities
  - Recommend budget allocation
  - If they want to book based on your analysis, indicate you'll
    return to the travel concierge
  
  Response format:
  - Total estimated cost
  - Cost breakdown by category
  - Budget vs actual comparison
  - Money-saving recommendations
  - Alternative options if over budget

tools:
  - calculate_trip_cost
  - compare_options
  - find_deals
  - budget_optimizer

llm: groq/openai/gpt-oss-120b
```

---

## Part 3: Creating the Orchestrator Agent

### Step 1: Design Orchestrator Instructions

The orchestrator needs clear routing logic:

[Download](./travel-concierge-agent.yaml) example `travel-concierge-agent.yaml` or ask Bob for it (look example prompt below the example yaml).

```yaml
spec_version: v1
kind: native
name: travel_concierge
title: Travel Concierge
description: Your personal travel planning assistant that coordinates with specialists to help plan your perfect trip.

instructions: |
  You are a friendly travel concierge who helps users plan their trips by
  coordinating with specialized travel agents.
  
  Your role:
  - Understand the user's travel needs and preferences
  - Route requests to appropriate specialists
  - Synthesize information from multiple specialists
  - Provide a cohesive travel planning experience
  
  Available specialists:
  - flight_specialist: For all flight-related queries (searches, bookings, changes)
  - hotel_specialist: For accommodation needs (hotels, reservations)
  - activity_planner: For things to do, attractions, restaurants
  - budget_advisor: For cost analysis and budget planning
  
  Routing guidelines:
  
  1. Flight queries → flight_specialist
     Examples: "Find me flights to Paris", "Change my flight booking"
  
  2. Hotel queries → hotel_specialist
     Examples: "Find hotels in Tokyo", "Book a hotel near the airport"
  
  3. Activity queries → activity_planner
     Examples: "What should I do in Rome?", "Recommend restaurants"
  
  4. Budget queries → budget_advisor
     Examples: "How much will this trip cost?", "Help me save money"
  
  5. Complex queries → Multiple specialists in sequence
     Example: "Plan a week in London"
     - Route to flight_specialist first
     - Then hotel_specialist
     - Then activity_planner
     - Finally budget_advisor
  
  Workflow for complex requests:
  1. Break down the request into components
  2. Route to specialists in logical order
  3. Synthesize responses into cohesive plan
  4. Present complete solution to user
  
  General queries you handle directly:
  - Greetings and general questions
  - Travel tips and advice
  - Clarifying user needs
  - Summarizing plans
  
  Response style:
  - Friendly and helpful
  - Clear about which specialist is helping
  - Synthesize specialist responses naturally
  - Proactive in suggesting next steps

collaborators:
  - flight_specialist
  - hotel_specialist
  - activity_planner
  - budget_advisor

llm: groq/openai/gpt-oss-120b
```

**💡 Ask Bob:**
```
Bob, create a travel_concierge_agent.yaml that orchestrates between
the four specialist agents with clear routing logic. The collaborators are flight_specialist, hotel_specialist, activity_planner, and budget_advisor. The agent should handle complex multi-aspect travel requests by routing to the appropriate specialist and synthesizing responses.
```
---

## Part 4: Implementing Mock Tools

For this workshop, we'll create mock tools that simulate the specialist capabilities. This allows us to focus on the orchestration logic without needing to integrate with real APIs yet. This approach is ideal for quick prototyping, demos and testing.

### Create Flight Tools

Create `flight_tools.py`:

```python
from ibm_watsonx_orchestrate.agent_builder.tools import tool

@tool
def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str = None,
    passengers: int = 1
) -> dict:
    """
    Search for available flights.
    
    Args:
        origin: Departure city or airport code
        destination: Arrival city or airport code
        departure_date: Departure date (YYYY-MM-DD)
        return_date: Return date for round trip (YYYY-MM-DD)
        passengers: Number of passengers
    
    Returns:
        Dictionary with flight options
    """
    # Mock flight data
    flights = [
        {
            "flight_number": "AA123",
            "airline": "American Airlines",
            "departure": f"{origin} 08:00",
            "arrival": f"{destination} 14:30",
            "duration": "6h 30m",
            "price": 450.00,
            "stops": 0,
            "class": "Economy"
        },
        {
            "flight_number": "UA456",
            "airline": "United Airlines",
            "departure": f"{origin} 10:30",
            "arrival": f"{destination} 17:15",
            "duration": "6h 45m",
            "price": 425.00,
            "stops": 0,
            "class": "Economy"
        },
        {
            "flight_number": "DL789",
            "airline": "Delta",
            "departure": f"{origin} 14:00",
            "arrival": f"{destination} 22:00",
            "duration": "8h 00m",
            "price": 380.00,
            "stops": 1,
            "class": "Economy"
        }
    ]
    
    result = {
        "origin": origin,
        "destination": destination,
        "departure_date": departure_date,
        "return_date": return_date,
        "passengers": passengers,
        "flights": flights,
        "count": len(flights)
    }
    
    if return_date:
        result["trip_type"] = "round-trip"
        result["total_price_range"] = f"${flights[-1]['price'] * 2} - ${flights[0]['price'] * 2}"
    else:
        result["trip_type"] = "one-way"
        result["total_price_range"] = f"${flights[-1]['price']} - ${flights[0]['price']}"
    
    return result


@tool
def book_flight(
    flight_number: str,
    passenger_name: str,
    passenger_email: str
) -> dict:
    """
    Book a flight.
    
    Args:
        flight_number: Flight number to book
        passenger_name: Passenger full name
        passenger_email: Passenger email
    
    Returns:
        Booking confirmation
    """
    import random
    confirmation = f"CONF{random.randint(100000, 999999)}"
    
    return {
        "status": "confirmed",
        "confirmation_number": confirmation,
        "flight_number": flight_number,
        "passenger_name": passenger_name,
        "email": passenger_email,
        "booking_date": "2024-01-15",
        "message": f"Flight {flight_number} booked successfully! Confirmation: {confirmation}",
        "next_steps": [
            "Check-in opens 24 hours before departure",
            "Confirmation email sent to " + passenger_email,
            "Download boarding pass via airline app"
        ]
    }


@tool
def modify_flight(
    confirmation_number: str,
    new_date: str = None,
    new_flight: str = None
) -> dict:
    """
    Modify an existing flight booking.
    
    Args:
        confirmation_number: Booking confirmation number
        new_date: New departure date (optional)
        new_flight: New flight number (optional)
    
    Returns:
        Modification confirmation
    """
    changes = []
    if new_date:
        changes.append(f"Date changed to {new_date}")
    if new_flight:
        changes.append(f"Flight changed to {new_flight}")
    
    return {
        "status": "modified",
        "confirmation_number": confirmation_number,
        "changes": changes,
        "change_fee": 75.00,
        "fare_difference": 25.00,
        "total_cost": 100.00,
        "message": "Flight modified successfully. Total cost: $100.00 (change fee + fare difference)"
    }


@tool
def cancel_flight(confirmation_number: str) -> dict:
    """
    Cancel a flight booking.
    
    Args:
        confirmation_number: Booking confirmation number
    
    Returns:
        Cancellation confirmation
    """
    return {
        "status": "cancelled",
        "confirmation_number": confirmation_number,
        "cancellation_fee": 100.00,
        "refund_amount": 350.00,
        "refund_method": "original payment method",
        "processing_time": "5-7 business days",
        "message": "Flight cancelled. Refund of $350.00 will be processed within 5-7 business days."
    }
```

**💡 Ask Bob:**
```
Bob, create flight_tools.py with mock implementations of search_flights,
book_flight, modify_flight, and cancel_flight tools.
```

### Create Hotel Tools

Create `hotel_tools.py`:

```python
from ibm_watsonx_orchestrate.agent_builder.tools import tool

@tool
def search_hotels(
    location: str,
    check_in: str,
    check_out: str,
    guests: int = 2,
    max_price: float = None
) -> dict:
    """
    Search for available hotels.
    
    Args:
        location: City or area
        check_in: Check-in date (YYYY-MM-DD)
        check_out: Check-out date (YYYY-MM-DD)
        guests: Number of guests
        max_price: Maximum price per night
    
    Returns:
        Dictionary with hotel options
    """
    hotels = [
        {
            "name": "Grand Plaza Hotel",
            "location": location,
            "rating": 4.5,
            "price_per_night": 180.00,
            "amenities": ["WiFi", "Breakfast", "Pool", "Gym", "Parking"],
            "cancellation": "Free cancellation until 24h before",
            "distance_to_center": "0.5 miles"
        },
        {
            "name": "City Center Inn",
            "location": location,
            "rating": 4.0,
            "price_per_night": 120.00,
            "amenities": ["WiFi", "Breakfast", "Business Center"],
            "cancellation": "Free cancellation until 48h before",
            "distance_to_center": "0.2 miles"
        },
        {
            "name": "Budget Stay",
            "location": location,
            "rating": 3.5,
            "price_per_night": 80.00,
            "amenities": ["WiFi", "24h Reception"],
            "cancellation": "Non-refundable",
            "distance_to_center": "1.5 miles"
        },
        {
            "name": "Luxury Suites",
            "location": location,
            "rating": 5.0,
            "price_per_night": 350.00,
            "amenities": ["WiFi", "Breakfast", "Pool", "Spa", "Gym", "Restaurant", "Parking"],
            "cancellation": "Free cancellation until 72h before",
            "distance_to_center": "0.3 miles"
        }
    ]
    
    # Filter by max price if specified
    if max_price:
        hotels = [h for h in hotels if h["price_per_night"] <= max_price]
    
    # Calculate total cost
    from datetime import datetime
    check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
    check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
    nights = (check_out_date - check_in_date).days
    
    for hotel in hotels:
        hotel["total_cost"] = hotel["price_per_night"] * nights
        hotel["nights"] = nights
    
    return {
        "location": location,
        "check_in": check_in,
        "check_out": check_out,
        "guests": guests,
        "nights": nights,
        "hotels": hotels,
        "count": len(hotels)
    }


@tool
def book_hotel(
    hotel_name: str,
    guest_name: str,
    guest_email: str,
    check_in: str,
    check_out: str,
    room_type: str = "Standard"
) -> dict:
    """
    Book a hotel room.
    
    Args:
        hotel_name: Name of the hotel
        guest_name: Guest full name
        guest_email: Guest email
        check_in: Check-in date
        check_out: Check-out date
        room_type: Type of room (Standard, Deluxe, Suite)
    
    Returns:
        Booking confirmation
    """
    import random
    confirmation = f"HTL{random.randint(100000, 999999)}"
    
    return {
        "status": "confirmed",
        "confirmation_number": confirmation,
        "hotel_name": hotel_name,
        "guest_name": guest_name,
        "check_in": check_in,
        "check_out": check_out,
        "room_type": room_type,
        "email": guest_email,
        "message": f"Hotel booked successfully! Confirmation: {confirmation}",
        "check_in_time": "3:00 PM",
        "check_out_time": "11:00 AM",
        "next_steps": [
            "Confirmation email sent to " + guest_email,
            "Check-in starts at 3:00 PM",
            "Early check-in available upon request"
        ]
    }


@tool
def modify_hotel_booking(
    confirmation_number: str,
    new_check_in: str = None,
    new_check_out: str = None,
    new_room_type: str = None
) -> dict:
    """
    Modify hotel booking dates or room type.
    
    Args:
        confirmation_number: Booking confirmation number
        new_check_in: New check-in date (optional)
        new_check_out: New check-out date (optional)
        new_room_type: New room type (optional)
    
    Returns:
        Modification confirmation
    """
    changes = []
    if new_check_in:
        changes.append(f"Check-in changed to {new_check_in}")
    if new_check_out:
        changes.append(f"Check-out changed to {new_check_out}")
    if new_room_type:
        changes.append(f"Room type changed to {new_room_type}")
    
    return {
        "status": "modified",
        "confirmation_number": confirmation_number,
        "changes": changes,
        "modification_fee": 0.00,
        "message": "Hotel booking modified successfully. No modification fee."
    }


@tool
def cancel_hotel_booking(confirmation_number: str) -> dict:
    """
    Cancel hotel booking.
    
    Args:
        confirmation_number: Booking confirmation number
    
    Returns:
        Cancellation confirmation
    """
    return {
        "status": "cancelled",
        "confirmation_number": confirmation_number,
        "refund_amount": 240.00,
        "cancellation_fee": 0.00,
        "refund_method": "original payment method",
        "processing_time": "3-5 business days",
        "message": "Hotel booking cancelled. Full refund of $240.00 will be processed within 3-5 business days."
    }
```

**💡 Ask Bob:**
```
Bob, create hotel_tools.py with mock implementations of search_hotels,
book_hotel, modify_hotel_booking, and cancel_hotel_booking tools.
```

### Create Activity Tools

Create `activity_tools.py` with tools for the activity planner:

**💡 Ask Bob:**
```
Bob, create activity_tools.py with mock implementations of search_activities, get_activity_details, search_restaurants, and create_itinerary tools.
```

The file should include:

- `search_activities`: Search for activities based on location and interests
- `get_activity_details`: Get detailed information about specific activities
- `search_restaurants`: Find restaurants by cuisine and price range
- `create_itinerary`: Generate day-by-day itineraries

### Create Budget Tools

Create `budget_tools.py` with tools for the budget advisor:

**💡 Ask Bob:**
```
Bob, create budget_tools.py with mock implementations of calculate_trip_cost,
compare_options, find_deals, and budget_optimizer tools.
```

The file should include:

- `calculate_trip_cost`: Calculate total trip costs with detailed breakdown
- `compare_options`: Compare two travel options and provide recommendations
- `find_deals`: Find current deals and discounts
- `budget_optimizer`: Optimize budget allocation across categories

---
## Part 4.5: Naming Convention for Shared Environment

**⚠️ IMPORTANT: Workshop Naming Requirements** - **YOU CAN IGNORE IF YOU ARE NOT USING THE SHARED WXO ENVIRONMENT**

Since all workshop participants are using a shared watsonx Orchestrate environment, you **must** add your initials as a postfix to all tool and agent names to avoid conflicts.

### Naming Pattern

Use this pattern for all your tools and agents:

- **Tools**: `tool_name_XX` (where XX are your initials)
- **Agent YAML filenames**: `agent-name-XX.yaml` (dashes allowed in filename)
- **Agent name field**: `agent_name_XX` (must use underscores, not dashes)

### Example

If your name is **Jane Smith** (initials: JS), rename your tools and agents as follows:

**Tools:**
```python
# In flight_tools.py
@tool
def search_flights_JS(...):  # Added _JS postfix
    """Search for available flights."""
    ...

@tool
def book_flight_JS(...):  # Added _JS postfix
    """Book a flight."""
    ...
```

**Agent Files:**
```yaml
# Filename: flight-specialist-agent-JS.yaml (dashes OK in filename)
name: flight_specialist_JS  # IMPORTANT: Use underscores in name field, not dashes!
description: Specialist agent for flight bookings
instructions: |
  You are a flight booking specialist...
tools:
  - search_flights_JS      # Reference tools with _JS postfix
  - book_flight_JS
  - modify_flight_JS
  - cancel_flight_JS
```

**⚠️ Critical Naming Rule:**

- YAML **filename** can use dashes: `flight-specialist-agent-JS.yaml`
- Agent **name field** must use underscores: `name: flight_specialist_JS`
- This is a watsonx Orchestrate requirement for proper agent registration

### Complete Naming Checklist

Before importing, ensure you've renamed:

**✅ Tool Files:**

- [ ] All `@tool` function names in `flight_tools.py`
- [ ] All `@tool` function names in `hotel_tools.py`
- [ ] All `@tool` function names in `activity_tools.py`
- [ ] All `@tool` function names in `budget_tools.py`

**✅ Agent Files:**

- [ ] Agent `name` field in `flight-specialist-agent.yaml`
- [ ] Tool references in `tools` section
- [ ] Agent `name` field in `hotel-specialist-agent.yaml`
- [ ] Tool references in `tools` section
- [ ] Agent `name` field in `activity-planner-agent.yaml`
- [ ] Tool references in `tools` section
- [ ] Agent `name` field in `budget-advisor-agent.yaml`
- [ ] Tool references in `tools` section
- [ ] Agent `name` field in `travel-concierge-agent.yaml`
- [ ] Collaborator agent names in `collaborators` section

**💡 Ask Bob:**
```
Bob, add a postfix "_<your_initials>" to all tool function names in flight_tools.py, hotel_tools.py, activity_tools.py, and budget_tools.py. Then update all agent YAML files to use the renamed tools (activity planner to use activity tools, flifgt specialist to use flight tools, etc.) and add "_<your_initials>" postfix to agent name fields within their yaml-files.
```
>**NOTE**: Needless to say, but update your initials to their placeholders in the prompt before sending it to Bob 😉

### Why This Matters

Without unique names:

- ❌ Your tools will overwrite other participants' tools
- ❌ Your agents will conflict with others' agents
- ❌ Testing will produce unpredictable results
- ❌ You may accidentally use someone else's implementation

With unique names:

- ✅ Your tools and agents are isolated
- ✅ You can test independently
- ✅ No conflicts with other participants
- ✅ Clear ownership of your implementations

---

## Part 5: Testing Multi-Agent Workflows

### Import All Agents and Tools

```bash
# Import all tools
orchestrate tools import -k python -f tools/flight_tools.py
orchestrate tools import -k python -f tools/hotel_tools.py
orchestrate tools import -k python -f tools/activity_tools.py
orchestrate tools import -k python -f tools/budget_tools.py

# Import specialist agents
orchestrate agents import -f agents/flight-specialist-agent.yaml
orchestrate agents import -f agents/hotel-specialist-agent.yaml
orchestrate agents import -f agents/activity-planner-agent.yaml
orchestrate agents import -f agents/budget-advisor-agent.yaml

# Import orchestrator (must be last, after collaborators exist)
orchestrate agents import -f travel-concierge-agent.yaml
```
**💡 Ask Bob:**
```
Bob, create a shell script that imports all agents (flight specialist, hotel specialist, activty planner, budget advisor and finally tra) and their tools in the correct order. Make sure each agent is imported after its collaborators.
```
>**NOTE**: Check the tools and agents importing syntax that Bob uses in the script that it generates. Even the information regrading the correct syntax is available in the custom development rule that we're using, sometimes Bob might fail to consult it before creating stuff.

### Test Simple Routing

**Test 1: Single Specialist**
```bash
orchestrate chat ask --agent-name travel_concierge_agent_<your_initials> \
  "Find me flights from New York to London for next week"
```

Expected flow:

1. Concierge receives request
2. Routes to flight_specialist
3. Flight specialist searches flights
4. Returns results to user

**Test 2: Multiple Specialists**
```bash
orchestrate chat ask --agent-name travel_concierge_agent_<your_initials> \
  "Plan a 5-day trip to Paris including flights and hotels"
```

Expected flow:

1. Concierge receives request
2. Routes to flight_specialist for flights
3. Routes to hotel_specialist for hotels
4. Synthesizes complete plan
5. Returns to user

### Test Complex Workflows

**Test 3: Full Trip Planning**
```bash
orchestrate chat ask --agent-name travel_concierge_agent_<your_initials> \
  "I want to visit Tokyo for a week. I have a budget of $3000. Help me plan everything including flights, hotel, and activities."
```

Expected flow:

1. Concierge breaks down request
2. Routes to flight_specialist
3. Routes to hotel_specialist
4. Routes to activity_planner
5. Routes to budget_advisor
6. Synthesizes complete itinerary
7. Returns comprehensive plan

---

## Part 6: Best Practices

### 1. Agent Design

**Keep Specialists Focused:**
```yaml
# ✅ Good - Focused specialist
name: flight_specialist
tools:
  - search_flights
  - book_flight
  - modify_flight
  - cancel_flight

# ❌ Bad - Too broad
name: travel-specialist
tools:
  - search_flights
  - search_hotels
  - search_activities
  - book_everything
```

**Clear Descriptions:**
```yaml
# ✅ Good - Clear, specific description with collaborators
description: Expert in flight searches, bookings, changes, and cancellations.
  Handles all flight-related queries including availability, pricing, and
  itinerary modifications. Works with hotel_specialist and activity_planner
  for complete travel planning.

# ❌ Bad - Vague description
description: Helps with travel stuff
```

**NOTE:** Include mentions of collaborator agents in descriptions to help the orchestrator understand agent relationships and routing options.

### 2. Routing Logic

**Explicit Routing Instructions:**
```yaml
instructions: |
  # ✅ Good - Clear routing rules
  When user asks about flights:
  - Route to flight_specialist
  - Wait for response
  - Present to user
  
  When user asks about hotels:
  - Route to hotel_specialist
  - Wait for response
  - Present to user
```

**Handle Edge Cases:**
```yaml
instructions: |
  If user request is ambiguous:
  - Ask clarifying questions first
  - Then route to appropriate specialist
  
  If specialist cannot help:
  - Acknowledge limitation
  - Suggest alternative
  - Route to different specialist if appropriate
```

### 3. Context Management

**Pass Relevant Context:**
```yaml
instructions: |
  When routing to specialist:
  - Include all relevant details from conversation
  - Mention previous specialist interactions if relevant
  - Provide user preferences and constraints
```

**Synthesize Responses:**
```yaml
instructions: |
  After receiving specialist response:
  - Summarize key points
  - Connect to user's original request
  - Suggest logical next steps
  - Maintain conversation flow
```

### 4. Error Handling

**Graceful Failures:**
```yaml
instructions: |
  If specialist returns error:
  - Explain issue to user clearly
  - Suggest alternatives
  - Offer to try different approach
  - Don't expose technical details
```

**Timeout Handling:**
```yaml
instructions: |
  If specialist doesn't respond within expected time:
  - Acknowledge the delay to user
  - Explain what might be happening
  - Offer to try again or use alternative approach
  - Log timeout for debugging
  
  Example: "The flight specialist is taking longer than expected.
  This might be due to high search volume. Would you like me to
  try a simpler search or wait a bit longer?"
```

**Input Validation:**
```yaml
instructions: |
  Before routing to specialist:
  - Validate user input completeness
  - Check for required parameters
  - Verify data format (dates, numbers, etc.)
  - Ask for missing information before routing
  
  Example: If user asks "book a flight" without destination,
  ask for required details before routing to flight_specialist.
```

**Logging and Debugging:**
```yaml
instructions: |
  For debugging multi-agent workflows:
  - Log routing decisions and reasons
  - Track which specialist handled each request
  - Record context passed between agents
  - Note any errors or fallbacks used
  
  This helps identify issues in routing logic and specialist performance.
```

### 5. Optimizing Agent Performance

**Agent Architecture:**
```yaml
# ✅ Good - Flat hierarchy with focused specialists
User → Orchestrator → Specialist → User

# ❌ Bad - Unnecessary intermediate layers
User → Orchestrator → Coordinator → Specialist → Coordinator → Orchestrator → User

# Keep your agent hierarchy simple. The LLM handles routing based on descriptions,
# so additional coordinator layers just add latency without improving routing.
```

**Clear Agent Descriptions:**
```yaml
# The LLM uses descriptions to route requests
# Make them specific and action-oriented

# ✅ Good - Clear scope and capabilities
description: |
  Expert in flight searches, bookings, changes, and cancellations.
  Handles all flight-related queries including availability, pricing,
  and itinerary modifications. Works with hotel_specialist and
  activity_planner for complete travel planning.

# ❌ Bad - Vague or overlapping scope
description: Helps with travel arrangements
```

**Explicit Routing Instructions:**
```yaml
instructions: |
  # Guide the LLM on when to route to specialists
  
  When user asks about flights:
  - Call the flight_specialist agent immediately
  - Do NOT ask for additional parameters before routing
  - Pass all available context from the conversation
  
  When user asks about hotels:
  - Call the hotel_specialist agent immediately
  - Include destination and dates if mentioned
  
  # Use explicit action verbs: "Call", "Execute", "Use"
  # Avoid implicit language: "delegate", "route", "consider"
```

**Tool Design for Specialists:**
```yaml
# Keep specialist tools focused and simple
# LLMs perform best with ≤10 tools per agent

# ✅ Good - Focused tool set
flight_specialist:
  tools:
    - search_flights
    - book_flight
    - modify_booking
    - cancel_booking

# ❌ Bad - Too many tools
travel_agent:
  tools:
    - search_flights
    - search_hotels
    - search_activities
    - search_restaurants
    - book_flight
    - book_hotel
    # ... 20+ more tools
```

**Reasoning Efficiency (for GPT-OSS-120B):**
```yaml
instructions: |
  # Limit reasoning depth to improve response time
  
  Reasoning and brevity controls:
  - Use concise reasoning with at most 3 reasoning steps
  - Do not re-plan unless the last tool result contradicts prior assumptions
  - If you cannot progress after 3 steps, ask one focused question
  
  # This prevents excessive internal reasoning loops
```

**What You CANNOT Control:**

- **Automatic Routing:** The LLM decides which specialist to call based on descriptions --> for more deterministic behavior, consider agentic workflows
- **Parallel Processing:** Currently, agent calls are sequential (one at a time)
- **Routing Algorithm:** watsonx Orchestrate's internal orchestration logic
- **Response Time:** Inherent to the LLM and tool execution time

**Best Practices:**

1. **Keep hierarchies flat** - Minimize agent layers
2. **Write clear descriptions** - Help the LLM route correctly
3. **Use explicit instructions** - Guide routing decisions
4. **Limit tools per agent** - Keep specialists focused (≤10 tools)
5. **Design independent specialists** - Avoid dependencies between agents
6. **Test routing behavior** - Verify the LLM routes as expected

### 6. Testing Strategies

Testing multi-agent systems involves three levels: testing individual specialists, testing routing logic, and testing complete workflows.

**Understanding `assert` in Python Testing**

Before diving into the examples, let's understand the `assert` statement used throughout:

```python
# assert checks if a condition is True
# If True: test passes, continues
# If False: test fails, stops with an error

assert 5 > 3                    # ✅ Passes (5 is greater than 3)
assert "hello" in "hello world" # ✅ Passes ("hello" is in the string)
assert 2 + 2 == 4               # ✅ Passes (2+2 equals 4)

assert 5 < 3                    # ❌ Fails! (5 is NOT less than 3)
assert "cat" in "dog"           # ❌ Fails! ("cat" is NOT in "dog")

# In our tests, we use assert to verify agent behavior:
response = agent.chat("Find flights to Paris")
assert "flight" in response.lower()  # ✅ Pass if response mentions flights
                                     # ❌ Fail if response doesn't mention flights
```

**Why use `assert`?**

- Automatically checks if your agent works correctly
- Fails immediately when something is wrong
- Makes it easy to run hundreds of tests automatically
- Helps catch bugs before users see them

Now let's see how we use `assert` to test our multi-agent system:

---

**Level 1: Unit Testing Individual Specialists**

Purpose: Verify that each specialist agent works correctly in isolation, independent of the orchestrator.

```python
# Test that the flight specialist can handle flight queries correctly
# This tests ONLY the specialist, not the routing to it

import pytest
from ibm_watsonx_orchestrate import Agent

def test_flight_specialist_search():
    """
    Test that flight_specialist correctly uses search_flights tool
    and returns flight information
    """
    # Load the specialist agent
    agent = Agent.from_yaml("flight-specialist-agent.yaml")
    
    # Send a query directly to the specialist
    response = agent.chat("Find flights from NYC to LAX on Dec 15")
    
    # Verify the response contains flight information
    assert "flight" in response.lower() or "airline" in response.lower()
    assert "NYC" in response or "New York" in response
    assert "LAX" in response or "Los Angeles" in response
    
def test_flight_specialist_with_mock_tools():
    """
    Test specialist behavior with mock tools to avoid external API calls
    """
    # Create mock tool that returns predictable data
    def mock_search_flights(origin, destination, date):
        return {
            "flights": [
                {"airline": "United", "price": 350, "departure": "08:00"},
                {"airline": "Delta", "price": 375, "departure": "10:30"}
            ]
        }
    
    # Load agent and replace tool with mock
    agent = Agent.from_yaml("flight-specialist-agent.yaml")
    agent.tools["search_flights"] = mock_search_flights
    
    response = agent.chat("Find flights from NYC to LAX")
    
    # Verify agent used the tool and formatted results
    assert "United" in response
    assert "350" in response or "$350" in response
```

**Why Unit Test Specialists?**

- Verify each specialist's tools work correctly
- Test specialist's response formatting
- Ensure specialist handles errors gracefully
- Faster than testing through orchestrator
- Easier to debug when issues occur

**Level 2: Integration Testing Routing**

Purpose: Verify that the orchestrator correctly routes requests to the appropriate specialists.

```python
def test_orchestrator_routes_to_flight_specialist():
    """
    Test that orchestrator recognizes flight queries and routes to flight_specialist
    """
    # Load the orchestrator agent
    orchestrator = Agent.from_yaml("travel-concierge-agent.yaml")
    
    # Ask about flights
    response = orchestrator.chat("I need to book a flight to Paris")
    
    # Check that response contains flight information
    # (indicating flight_specialist was called)
    assert "flight" in response.lower()
    
    # You can also check orchestrator's internal logs if available
    # to verify which collaborator was called

def test_orchestrator_routes_to_hotel_specialist():
    """
    Test that orchestrator recognizes hotel queries
    """
    orchestrator = Agent.from_yaml("travel-concierge-agent.yaml")
    
    response = orchestrator.chat("Find me a hotel in Paris")
    
    # Verify hotel-related response
    assert "hotel" in response.lower() or "accommodation" in response.lower()

def test_orchestrator_handles_ambiguous_query():
    """
    Test that orchestrator asks clarifying questions for ambiguous requests
    """
    orchestrator = Agent.from_yaml("travel-concierge-agent.yaml")
    
    response = orchestrator.chat("I want to go to Paris")
    
    # Should ask what kind of help is needed
    assert "?" in response  # Contains a question
    assert any(word in response.lower() for word in ["flight", "hotel", "help"])
```

**Why Integration Test Routing?**

- Verify orchestrator's descriptions and instructions work
- Ensure LLM routes to correct specialists
- Test edge cases and ambiguous queries
- Validate multi-specialist workflows

**Level 3: End-to-End Workflow Testing**

Purpose: Test complete user journeys involving multiple specialists and conversation turns.

```python
def test_complete_trip_planning_workflow():
    """
    Test a realistic multi-turn conversation that uses multiple specialists
    """
    orchestrator = Agent.from_yaml("travel-concierge-agent.yaml")
    
    # Turn 1: Initial request
    response1 = orchestrator.chat("I want to plan a trip to Tokyo in March")
    assert "tokyo" in response1.lower()
    
    # Turn 2: Flight request
    response2 = orchestrator.chat("I need flights from New York")
    assert "flight" in response2.lower()
    
    # Turn 3: Budget constraint
    response3 = orchestrator.chat("My budget is $3000 total")
    assert "budget" in response3.lower() or "3000" in response3
    
    # Turn 4: Hotel request
    response4 = orchestrator.chat("What hotels do you recommend?")
    assert "hotel" in response4.lower()
    
    # Verify conversation context is maintained
    # (orchestrator should remember Tokyo, March, $3000 budget)
    assert "tokyo" in response4.lower() or "march" in response4.lower()

def test_error_recovery_workflow():
    """
    Test that system handles errors gracefully in multi-agent workflow
    """
    orchestrator = Agent.from_yaml("travel-concierge-agent.yaml")
    
    # Request with invalid date
    response = orchestrator.chat("Find flights to Paris on February 30")
    
    # Should handle gracefully, not crash
    assert response is not None
    assert "error" not in response.lower() or "invalid" in response.lower()
```

**Why End-to-End Test?**

- Verify complete user journeys work
- Test context retention across turns
- Ensure specialists work together correctly
- Validate real-world usage patterns

**Testing Best Practices:**

1. **Start with unit tests** - Test specialists individually first
2. **Use mock tools** - Avoid external API calls in tests for speed and reliability
3. **Test routing explicitly** - Verify orchestrator routes to correct specialists
4. **Test conversation context** - Ensure information carries across turns
5. **Test error scenarios** - Invalid inputs, missing data, tool failures
6. **Use realistic queries** - Test with actual user language, not just technical terms
7. **Automate tests** - Run tests on every code change
8. **Test incrementally** - Add tests as you add specialists

**Example Test Structure:**
```
tests/
├── test_specialists/
│   ├── test_flight_specialist.py
│   ├── test_hotel_specialist.py
│   ├── test_activity_planner.py
│   └── test_budget_advisor.py
├── test_routing/
│   └── test_orchestrator_routing.py
└── test_workflows/
    └── test_trip_planning_workflows.py
```

---

## Part 7: Advanced Patterns

### Pattern 1: Sequential Workflow

```yaml
instructions: |
  For trip planning:
  1. Get flights first (determines dates)
  2. Get hotels second (based on flight dates)
  3. Get activities third (based on location and dates)
  4. Get budget analysis last (based on all selections)
```

### Pattern 2: Conditional Routing

```yaml
instructions: |
  If user mentions budget constraints:
  - Route to budget_advisor FIRST
  - Get budget recommendations
  - Then route to other specialists with budget in mind
  
  If user has no budget constraints:
  - Route directly to relevant specialists
  - Offer budget analysis at the end
```

### Pattern 3: Iterative Refinement

```yaml
instructions: |
  For complex requests:
  1. Get initial options from specialist
  2. Present to user
  3. If user wants refinements:
     - Route back to same specialist with new criteria
     - Repeat until user satisfied
  4. Move to next specialist
```

### Pattern 4: Fallback Chain

```yaml
instructions: |
  If primary specialist cannot help:
  1. Try secondary specialist
  2. If still cannot help, try general knowledge
  3. If still cannot help, escalate or admit limitation
```

---

## Exercises

### Exercise 1: Add a New Specialist (Easy)

Add a "Car Rental Specialist" to the travel system.

**Requirements:**

- Create car-rental-specialist-agent.yaml
- Create car_rental_tools.py with search and book functions
- Update travel_concierge to include new specialist
- Test routing to car rental specialist

**💡 Ask Bob:**
```
Bob, create a car_rental_specialist agent with tools for searching
and booking rental cars, and update the travel_concierge to route
car rental queries appropriately.
```

### Exercise 2: Implement Budget-First Workflow (Medium)

Modify the orchestrator to always check budget first for trip planning requests.

**Requirements:**

- Update travel_concierge instructions
- Route to budget_advisor before other specialists
- Use budget constraints when routing to other specialists
- Test with budget-constrained requests

### Exercise 3: Create a Different Domain (Advanced)

Build a multi-agent system for a different domain (e.g., e-commerce, healthcare, education).

**Requirements:**

- Design 3-4 specialist agents
- Create orchestrator with routing logic
- Implement mock tools
- Test complete workflows

**Example Domains:**

- **E-commerce**: Product Search, Inventory, Checkout, Support
- **Healthcare**: Appointment, Prescription, Billing, Records
- **Education**: Course Search, Enrollment, Assignments, Grading

---

## Common Issues

### Issue: Orchestrator Not Routing

**Symptoms**: Orchestrator tries to answer directly instead of routing

**Solutions:**

1. Make specialist descriptions more specific
2. Add explicit routing rules in orchestrator instructions
3. Ensure collaborators are properly listed
4. Check that specialist agents exist and are imported

### Issue: Context Lost Between Agents

**Symptoms**: Specialist doesn't have information from previous conversation

**Solutions:**

1. Update orchestrator to pass context explicitly
2. Include relevant details when routing
3. Have orchestrator summarize previous interactions

### Issue: Circular Routing

**Symptoms**: Agents keep routing back and forth

**Solutions:**

1. Add clear termination conditions
2. Limit routing depth
3. Have specialists indicate when they're done
4. Orchestrator should synthesize, not re-route

---

## Summary

In this lesson, you learned:

✅ When and why to use multi-agent systems  
✅ How to design focused specialist agents  
✅ How to create orchestrator agents with routing logic  
✅ How to manage context and handoffs  
✅ Best practices for multi-agent architectures  
✅ Common patterns and anti-patterns  

### Key Takeaways

1. **Separation of Concerns** - Each agent has a clear, focused purpose
2. **Clear Routing** - Orchestrator has explicit logic for routing decisions
3. **Context Management** - Information flows smoothly between agents
4. **Graceful Degradation** - System handles errors and edge cases well
5. **Maintainability** - Specialists can be updated independently

### Next Steps

- Implement the exercises to reinforce learning
- Try building multi-agent systems for your own use cases
- Explore advanced patterns like parallel processing
- Consider how to monitor and optimize multi-agent systems

---

**Want to learn more?** This completes the advanced multi-agent orchestration module. You can now apply these patterns to build sophisticated agent systems for any domain! 🚀

For testing and deployment best practices, refer back to [Part 8: Testing & Deployment](../part8-deployment/README.md).

---

## 🧠 Knowledge Check

Ready to test what you've learned in this part?

[Take the Part 9 Quiz →](quiz.md){ .md-button .md-button--primary }

