package com.astralis.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AstralisController {

    public record LeaderboardEntry(String commander, int year, int population, int sustainability) {}
    public record Exoplanet(String id, String name, double orbitAU, boolean habitableZone, String tempC, double gravity, String confidence, String primaryResource) {}
    public record StarSystem(String seed, String starClass, String starColor, double distanceLY, List<Exoplanet> planets) {}
    public record CuriosityRequest(String topic, String context, String question) {}

    private final RestClient restClient = RestClient.create();
    private final List<LeaderboardEntry> leaderboard = new CopyOnWriteArrayList<>();

    public AstralisController() {
        leaderboard.add(new LeaderboardEntry("Artemis Command", 2064, 14200, 92));
        leaderboard.add(new LeaderboardEntry("Ares Pioneer", 2051, 8450, 86));
    }

    // 1. AI MISSION STRATEGIST (Gemini API + Smart Local Fallback)
    @PostMapping("/ai/strategize")
    public Map<String, Object> strategize(@RequestBody Map<String, Object> payload) {
        String planet = String.valueOf(payload.getOrDefault("planet", "Mars"));
        String crisis = String.valueOf(payload.getOrDefault("crisis", "Routine Optimization"));
        Object energy = payload.getOrDefault("energy", 50);
        Object water = payload.getOrDefault("water", 50);
        Object oxygen = payload.getOrDefault("oxygen", 50);

        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String prompt = String.format(
                    "You are ASTRALIS, an aerospace mission strategist AI. Colony: %s. Crisis: %s. " +
                    "Telemetry -> Energy: %s%%, Water: %s%%, Oxygen: %s%%. " +
                    "Give a concise 3-bullet action plan (max 65 words) to stabilize ECLSS life support and ISRU logistics.",
                    planet, crisis, energy, water, oxygen
                );

                Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
                );

                Map<?, ?> response = restClient.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

                if (response != null && response.get("candidates") instanceof List<?> candidates && !candidates.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) first.get("content");
                    List<?> parts = (List<?>) content.get("parts");
                    String aiText = String.valueOf(((Map<?, ?>) parts.get(0)).get("text"));
                    return Map.of("source", "Gemini AI", "recommendation", aiText);
                }
            } catch (Exception ignored) {
                // Falls through cleanly to deterministic aerospace fallback
            }
        }

        String fallback = String.format(
            "• IMMEDIATE: Throttle non-essential ISRU mining on %s to preserve %s%% energy reserves during %s.\n" +
            "• LOGISTICS: Dispatch an emergency Hohmann cargo transfer of water ice & fuel cells from Luna/Ceres.\n" +
            "• ECLSS RECOVERY: Shift habitats to closed-loop O2/H2O recycling (currently %s%% O2) until solar flux normalizes.",
            planet, energy, crisis, oxygen
        );
        return Map.of("source", "ASTRALIS Local Engine", "recommendation", fallback);
    }

    // 2. TIER 3 PROCEDURAL UNCHARTED STAR SYSTEM GENERATOR
    @GetMapping("/exoplanets/generate")
    public StarSystem generateSystem(@RequestParam(defaultValue = "SECTOR-492-A") String seed) {
        Random rng = new Random(seed.hashCode());
        String[] starClasses = {"G-Type Yellow Dwarf", "K-Type Orange Dwarf", "M-Type Red Dwarf", "F-Type White Star"};
        String[] starColors = {"#fde047", "#fb923c", "#f87171", "#e0f2fe"};
        int starIdx = rng.nextInt(starClasses.length);

        String[] resourcePool = {"Subsurface Ice", "Helium-3", "Platinum-Group Metals", "Silicate Regolith", "Liquid Methane", "Rare Earths"};
        int planetCount = 3 + rng.nextInt(3);
        List<Exoplanet> worlds = new ArrayList<>();

        for (int i = 1; i <= planetCount; i++) {
            double au = Math.round((0.4 + i * 0.75 + rng.nextDouble() * 0.4) * 100.0) / 100.0;
            boolean habitable = au >= 0.8 && au <= 1.8;
            int tempC = (int) Math.round(280 / Math.sqrt(au) - 273);
            double gravity = Math.round((0.4 + rng.nextDouble() * 1.4) * 9.81 * 100.0) / 100.0;

            worlds.add(new Exoplanet(
                seed + "-P" + i,
                seed + " " + (char) ('b' + i - 1),
                au,
                habitable,
                tempC + "°C",
                gravity,
                (55 + rng.nextInt(35)) + "%",
                resourcePool[rng.nextInt(resourcePool.length)]
            ));
        }

        double distanceLY = Math.round((4.2 + rng.nextDouble() * 45.0) * 10.0) / 10.0;
        return new StarSystem(seed, starClasses[starIdx], starColors[starIdx], distanceLY, worlds);
    }

    // 3. SUSTAINABILITY LEADERBOARD
    @GetMapping("/leaderboard")
    public List<LeaderboardEntry> getLeaderboard() {
        return leaderboard;
    }

    // 4. CURIOSITY PANEL (Ask Anything About Any Planet, Moon, Star, or Multiverse Stage)
    @PostMapping("/ai/curiosity")
    public Map<String, Object> askCuriosity(@RequestBody CuriosityRequest req) {
        String topic = req.topic() != null ? req.topic() : "The Universe";
        String context = req.context() != null ? req.context() : "";
        String question = req.question() != null ? req.question() : "Tell me something fascinating about this.";

        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String prompt = String.format(
                    "You are ASTRALIS, an enthusiastic NASA astrophysicist and space-mission educator. " +
                    "The user is currently inspecting: %s (%s). " +
                    "User question: \"%s\". " +
                    "Answer clearly in 3-4 engaging, scientifically accurate sentences (max 95 words). Include one surprising real fact.",
                    topic, context, question
                );

                Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
                );

                Map<?, ?> response = restClient.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

                if (response != null && response.get("candidates") instanceof List<?> candidates && !candidates.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) first.get("content");
                    List<?> parts = (List<?>) content.get("parts");
                    String aiText = String.valueOf(((Map<?, ?>) parts.get(0)).get("text"));
                    return Map.of("source", "Gemini 2.5 Flash", "answer", aiText);
                }
            } catch (Exception ignored) {
                // Falls through cleanly to local knowledge fallback
            }
        }

        String fallback = String.format(
            "%s is a key frontier in deep-space science. %s To unlock live custom answers to \"%s\", set your GEMINI_API_KEY environment variable in the Spring Boot terminal.",
            topic, context, question
        );
        return Map.of("source", "ASTRALIS Local Knowledge", "answer", fallback);
    }

    @PostMapping("/leaderboard")
    public List<LeaderboardEntry> submitScore(@RequestBody LeaderboardEntry entry) {
        leaderboard.add(entry);
        return leaderboard;
    }
}