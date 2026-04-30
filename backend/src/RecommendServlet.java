// This file handles requests sent to /recommend:
	// GET  action=getRecommendedRecipes : returns the top 8 recipes recommended for a user_id, sorted by recommendation score (highest first)

	// Recommendation logic: 
		// If user has saved recipes: recommend recipes with same category, difficulty, cook/prep time, and recipe rating
		// If user has no saved recipes: recommend top 8 highest rated recipes

import java.io.IOException;
import java.sql.*;
import java.util.*;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/recommend")
public class RecommendServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    // Method to let .js call the servlet and tell browser response is JSON
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
    }

    // Method to handle browser preflight requests for CORS --> for frontend to send JSON using fetch
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

  
    // DOGET METHOD: check action parameter of HTTP request for:
        // GET action=getRecommendedRecipes --> return top 8 recommended recipes for user_id
        // Response Structure:
        // {
        //   "success": true,
        //   "user_id": 4,
        //   "recommendations": [
        //      {
        //          "recipe_id": 1,
        //          "user_id": 2,
        //          "recipe_name": "Recipe Name",
        //          "ingredients": "...",
        //          "instructions": "...",
        //          "prep_time": 10,
        //          "cook_time": 20,
        //          "difficulty": "Easy",
        //          "category": "Asian",
        //          "photo_url": "...",
        //          "created_at": "...",
        //          "average_rating": 4.5,
        //          "rating_count": 12,
        //          "recommendation_score": 9.4
        //      }
        //   ]
        // }
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            if ("getRecommendedRecipes".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));

                JSONArray recommendations = getRecommendedRecipesJson(conn, userId);

                res.put("success", true);
                res.put("user_id", userId);
                res.put("recommendations", recommendations);

            } else {
                res.put("success", false);
                res.put("message", "Invalid action");
            }

        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        response.getWriter().print(res.toString());
    }
    
    

    // HELPER FUNCTION: getRecommendedRecipesJson()
    // Decides whether to personalize recommendations or return highest-rated recipes
    private JSONArray getRecommendedRecipesJson(Connection conn, int userId) throws Exception {

        boolean hasSavedRecipesTable = tableExists(conn, "SavedRecipes");

        // If SavedRecipes table does not exist, return highest-rated recipes
        if (!hasSavedRecipesTable) {
            return getHighestRatedRecipesJson(conn, userId);
        }

        UserPreferenceProfile profile = getUserPreferenceProfile(conn, userId);

        // If user has no saved recipes, return highest-rated recipes
        if (profile.savedCount == 0) {
            return getHighestRatedRecipesJson(conn, userId);
        }

        return getPersonalizedRecipesJson(conn, userId, profile);
    }
    
    

    // HELPER FUNCTION: tableExists()
    // Checks if a table exists before trying to query it
    // This prevents errors if SavedRecipes has not been created yet
    private boolean tableExists(Connection conn, String tableName) throws Exception {
        DatabaseMetaData metaData = conn.getMetaData();

        try (ResultSet rs = metaData.getTables(null, null, tableName, null)) {
            if (rs.next()) {
                return true;
            }
        }

        try (ResultSet rs = metaData.getTables(null, null, tableName.toLowerCase(), null)) {
            return rs.next();
        }
    }
    
    

    // HELPER FUNCTION: getUserPreferenceProfile()
    // Looks at the user's saved recipes and builds a simple preference profile
    // Preferences are based on category, difficulty, and average recipe time
    private UserPreferenceProfile getUserPreferenceProfile(Connection conn, int userId) throws Exception {
        UserPreferenceProfile profile = new UserPreferenceProfile();

        PreparedStatement stmt = conn.prepareStatement(
                "SELECT r.category, r.difficulty, r.prep_time, r.cook_time " +
                "FROM SavedRecipes s " +
                "JOIN Recipes r ON s.recipe_id = r.recipe_id " +
                "WHERE s.user_id = ?");

        stmt.setInt(1, userId);
        ResultSet rs = stmt.executeQuery();

        int totalPrepTime = 0;
        int totalCookTime = 0;

        while (rs.next()) {
            profile.savedCount++;

            String category = rs.getString("category");
            String difficulty = rs.getString("difficulty");

            if (category != null && !category.trim().isEmpty()) {
                profile.categoryCounts.put(category, profile.categoryCounts.getOrDefault(category, 0) + 1);
            }

            if (difficulty != null && !difficulty.trim().isEmpty()) {
                profile.difficultyCounts.put(difficulty, profile.difficultyCounts.getOrDefault(difficulty, 0) + 1);
            }

            totalPrepTime += rs.getInt("prep_time");
            totalCookTime += rs.getInt("cook_time");
        }

        if (profile.savedCount > 0) {
            profile.averagePrepTime = totalPrepTime / profile.savedCount;
            profile.averageCookTime = totalCookTime / profile.savedCount;
        }

        return profile;
    }


  
    // HELPER FUNCTION: getPersonalizedRecipesJson()
    // Returns top 8 recipes using a recommendation score
    // Score considers:
        // average rating
        // number of ratings
        // category similarity to saved recipes
        // difficulty similarity to saved recipes
        // prep/cook time similarity to saved recipes
    private JSONArray getPersonalizedRecipesJson(Connection conn, int userId, UserPreferenceProfile profile)
            throws Exception {

        PreparedStatement stmt = conn.prepareStatement(
                "SELECT " +
                "r.recipe_id, r.user_id, r.recipe_name, r.ingredients, r.instructions, " +
                "r.prep_time, r.cook_time, r.difficulty, r.category, r.photo_url, r.created_at, " +
                "COALESCE(AVG(rt.rating_value), 0) AS average_rating, " +
                "COUNT(rt.rating_id) AS rating_count " +
                "FROM Recipes r " +
                "LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id " +
                "WHERE r.recipe_id NOT IN (SELECT recipe_id FROM SavedRecipes WHERE user_id = ?) " +
                "GROUP BY r.recipe_id, r.user_id, r.recipe_name, r.ingredients, r.instructions, " +
                "r.prep_time, r.cook_time, r.difficulty, r.category, r.photo_url, r.created_at");

        stmt.setInt(1, userId);
        ResultSet rs = stmt.executeQuery();

        List<RecommendedRecipe> recipes = new ArrayList<>();

        while (rs.next()) {
            JSONObject recipeJson = recipeResultToJson(rs);

            double averageRating = rs.getDouble("average_rating");
            int ratingCount = rs.getInt("rating_count");
            String category = rs.getString("category");
            String difficulty = rs.getString("difficulty");
            int prepTime = rs.getInt("prep_time");
            int cookTime = rs.getInt("cook_time");

            double score = calculateRecommendationScore(
                    averageRating,
                    ratingCount,
                    category,
                    difficulty,
                    prepTime,
                    cookTime,
                    profile
            );

            recipeJson.put("recommendation_score", score);

            RecommendedRecipe rec = new RecommendedRecipe();
            rec.recipeJson = recipeJson;
            rec.score = score;

            recipes.add(rec);
        }

        recipes.sort((a, b) -> Double.compare(b.score, a.score));

        JSONArray recommendations = new JSONArray();

        // respond with top 8 recommendations:
        for (int i = 0; i < recipes.size() && i < 8; i++) {
            recommendations.put(recipes.get(i).recipeJson);
        }
        
        /*// If want to return all recipes in DB:
        for (int i = 0; i < recipes.size(); i++) {
		    recommendations.put(recipes.get(i).recipeJson);
		} */

        return recommendations;
    }


  
    // HELPER FUNCTION: getHighestRatedRecipesJson()
    // Used when the user has no saved recipes or when SavedRecipes table does not exist
    // Returns top 8 recipes sorted by average rating, rating count, then newest recipe
    private JSONArray getHighestRatedRecipesJson(Connection conn, int userId) throws Exception {
        PreparedStatement stmt = conn.prepareStatement(
                "SELECT " +
                "r.recipe_id, r.user_id, r.recipe_name, r.ingredients, r.instructions, " +
                "r.prep_time, r.cook_time, r.difficulty, r.category, r.photo_url, r.created_at, " +
                "COALESCE(AVG(rt.rating_value), 0) AS average_rating, " +
                "COUNT(rt.rating_id) AS rating_count " +
                "FROM Recipes r " +
                "LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id " +
                "GROUP BY r.recipe_id, r.user_id, r.recipe_name, r.ingredients, r.instructions, " +
                "r.prep_time, r.cook_time, r.difficulty, r.category, r.photo_url, r.created_at " +
                "ORDER BY average_rating DESC, rating_count DESC, r.created_at DESC " +
                "LIMIT 8");

        // If want to return all recipes in DB:
        // "ORDER BY average_rating DESC, rating_count DESC, r.created_at DESC");
        
        ResultSet rs = stmt.executeQuery();
        JSONArray recommendations = new JSONArray();

        while (rs.next()) {
            JSONObject recipe = recipeResultToJson(rs);

            // For highest-rated fallback, recommendation score is just based on rating quality
            double score = rs.getDouble("average_rating") + Math.min(rs.getInt("rating_count"), 20) * 0.05;
            recipe.put("recommendation_score", score);

            recommendations.put(recipe);
        }

        return recommendations;
    }


  
    // HELPER FUNCTION: calculateRecommendationScore()
    // Higher score means recipe should be recommended earlier
    private double calculateRecommendationScore(
            double averageRating,
            int ratingCount,
            String category,
            String difficulty,
            int prepTime,
            int cookTime,
            UserPreferenceProfile profile) {

        double score = 0.0;

        // Rating matters most
        score += averageRating * 2.0;

        // Recipes with more ratings get a small boost
        score += Math.min(ratingCount, 20) * 0.05;

        // Category match gets a strong boost
        if (category != null && profile.categoryCounts.containsKey(category)) {
            score += profile.categoryCounts.get(category) * 1.5;
        }

        // Difficulty match gets a smaller boost
        if (difficulty != null && profile.difficultyCounts.containsKey(difficulty)) {
            score += profile.difficultyCounts.get(difficulty) * 0.75;
        }

        // Similar prep time gets a small boost
        int prepDifference = Math.abs(prepTime - profile.averagePrepTime);
        if (prepDifference <= 10) {
            score += 0.5;
        }

        // Similar cook time gets a small boost
        int cookDifference = Math.abs(cookTime - profile.averageCookTime);
        if (cookDifference <= 15) {
            score += 0.5;
        }

        return score;
    }


  
    // HELPER FUNCTION: recipeResultToJson()
    // Turns a recipe result row into JSON for frontend
    private JSONObject recipeResultToJson(ResultSet rs) throws Exception {
        JSONObject recipe = new JSONObject();

        recipe.put("recipe_id", rs.getInt("recipe_id"));
        recipe.put("user_id", rs.getInt("user_id"));
        recipe.put("recipe_name", rs.getString("recipe_name"));
        recipe.put("ingredients", rs.getString("ingredients"));
        recipe.put("instructions", rs.getString("instructions"));
        recipe.put("prep_time", rs.getInt("prep_time"));
        recipe.put("cook_time", rs.getInt("cook_time"));
        recipe.put("difficulty", rs.getString("difficulty"));
        recipe.put("category", rs.getString("category"));
        recipe.put("photo_url", rs.getString("photo_url"));
        recipe.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
        recipe.put("average_rating", rs.getDouble("average_rating"));
        recipe.put("rating_count", rs.getInt("rating_count"));

        return recipe;
    }


  
    // HELPER CLASS: UserPreferenceProfile
    // Stores information learned from a user's saved recipes
    private static class UserPreferenceProfile {
        int savedCount = 0;
        int averagePrepTime = 0;
        int averageCookTime = 0;

        Map<String, Integer> categoryCounts = new HashMap<>();
        Map<String, Integer> difficultyCounts = new HashMap<>();
    }


  
    // HELPER CLASS: RecommendedRecipe
    // Used to sort recipes by recommendation score
    private static class RecommendedRecipe {
        JSONObject recipeJson;
        double score;
    }
}
