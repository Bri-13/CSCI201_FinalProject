// This file handles requests sent to /ratings:
	// GET  action=getRatingSummaryByRecipe : returns number of ratings a recipe_id has and its overall rating (avg of all ratings)
	// GET  action=getAllRatingsByRecipe : returns all ratings for a recipe_id 


import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/ratings")
public class RatingsServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	// Method to let .js call the servlet and tell browser response is JSON
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
    }

    // Method to handle browser preflight requests for CORS --> for frontend to send JSON using fetch: 
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    
    // DOGET METHOD: check action parameter of HTTP request for:
    	// GET SUMMARY : action=getRatingSummaryByRecipe --> returns number of ratings a recipe_id has and its overall rating (avg of all ratings)
    		// Response Structure:
 			//	{   "success": true,
 			//  	"recipe_id": 4,
 			//  	"rating_count": 17
			//  	"average_rating": 2.34	}
		 // GET RATINGS : action=getAllRatingsByRecipe --> returns JSONArray of all ratings for a recipe_id
			// Response Structure:
			//	{   "success": true,
			//  	"recipe_id": 4,
			//  	"ratings": rating JSONArray{}	}
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            // check action parameters for specified data to GET:
            if ("getRatingSummaryByRecipe".equals(action)) {

			    int recipeId = Integer.parseInt(request.getParameter("recipe_id"));
				// call helper to summary object to return rating_count and average_rating
			    JSONObject summary = getRatingSummaryJson(conn, recipeId);
			
			    res.put("success", true);
			    res.put("recipe_id", recipeId);
			    res.put("rating_count", summary.getInt("rating_count"));
			    res.put("average_rating", summary.getDouble("average_rating"));
				
			} else if ("getAllRatingsByRecipe".equals(action)) {

				int recipeId = Integer.parseInt(request.getParameter("recipe_id"));

			    // GET all ratings for a recipe
			    JSONArray ratings = getAllRatingsByRecipeJson(conn, recipeId);

			    res.put("success", true);
			    res.put("recipe_id", recipeId);
			    res.put("ratings", ratings);
			    
			} else {
				res.put("success", false);
				res.put("message", "Invalid action");
			}
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        // send response back to browser
        response.getWriter().print(res.toString());
    }

    

    
    // *HELPER FUNCTION* : getRatingSummaryJson()
    // Sends statement to DB to request JSON obj of a specified recipeID's rating information 
		// Response Structure:
		//	{   "recipe_id": 4,
		//  	"rating_count": 179,
		//  	"average_rating": 2.34	}
    private JSONObject getRatingSummaryJson(Connection conn, int recipeId) throws Exception {
        
    	// request to DB for: rating_count, and average_rating
    	PreparedStatement stmt = conn.prepareStatement(
                "SELECT " +
                "COUNT(*) AS rating_count, " +
                "COALESCE(AVG(rating_value), 0) AS average_rating " +
                "FROM ratings WHERE recipe_id = ?");

        stmt.setInt(1, recipeId);
        ResultSet rs = stmt.executeQuery();

        JSONObject summary = new JSONObject();

        if (rs.next()) {
            summary.put("recipe_id", recipeId);
            summary.put("rating_count", rs.getInt("rating_count"));
            summary.put("average_rating", rs.getDouble("average_rating"));
        }

        return summary; // JSON obj of {String = "rating_info_name" : Object = data}
    }

    


	//*HELPER FUNCTION* : getAllRatingsByRecipeJson()
	//Sends statement to DB to request JSON array of all ratings for a specified recipe_id
	//Response Structure:
	//[
	//   {
	//       "rating_id": 1,
	//       "recipe_id": 4,
	//       "user_id": 7,
	//       "rating_value": 5,
	//       "created_at": "2026-04-25 13:30:00",
	//       "updated_at": "2026-04-25 13:30:00"
	//   }
	//]
	private JSONArray getAllRatingsByRecipeJson(Connection conn, int recipeId) throws Exception {
	
	 PreparedStatement stmt = conn.prepareStatement(
	         "SELECT rating_id, recipe_id, user_id, rating_value, created_at, updated_at " +
	         "FROM ratings WHERE recipe_id = ? " +
	         "ORDER BY updated_at DESC");
	
	 stmt.setInt(1, recipeId);
	 ResultSet rs = stmt.executeQuery();
	
	 JSONArray ratings = new JSONArray();
	
	 while (rs.next()) {
	     JSONObject rating = new JSONObject();
	
	     rating.put("rating_id", rs.getInt("rating_id"));
	     rating.put("recipe_id", rs.getInt("recipe_id"));
	     rating.put("user_id", rs.getInt("user_id"));
	     rating.put("rating_value", rs.getInt("rating_value"));
	     rating.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
	     rating.put("updated_at", String.valueOf(rs.getTimestamp("updated_at")));
	
	     ratings.put(rating);
	 }
	
	 return ratings;
	}


}

    
   

