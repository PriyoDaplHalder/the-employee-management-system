import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Project from "@/model/Project";

// Helper function to get and verify token from request
const getAuthenticatedUser = (request) => {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
};

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Check if user has access (management only for now)
    if (user.role !== "management") {
      return NextResponse.json(
        { error: "Access denied. Management role required." },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      relatedInfo: project.relatedInfo || {
        mondayBoardLink: "",
        ganttChartLink: "",
        issueListLink: "",
        sampleExcelSheetLink: "",
        timeSheetLink: "",
        github: {
          backendLink: "",
          frontendLink: "",
          email: "",
          uid: "",
          token: "",
          password: "",
          mainBranch: "main",
        },
        homePageLink: "",
        adminPanel: {
          link: "",
          email: "",
          password: "",
        },
        notes: "",
        dynamicBoxes: [],
      },
    });
  } catch (error) {
    console.error("Error fetching project related info:", error);
    
    // Handle authentication errors
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const user = getAuthenticatedUser(request);
    const projectId = params.id;

    // Check if user has access (management only for now)
    if (user.role !== "management") {
      return NextResponse.json(
        { error: "Access denied. Management role required." },
        { status: 403 }
      );
    }

    // Parse request body
    const { relatedInfo } = await request.json();
    
    console.log("Received relatedInfo:", JSON.stringify(relatedInfo, null, 2));
    console.log("Dynamic boxes:", relatedInfo.dynamicBoxes);

    // Validate input
    if (!relatedInfo || typeof relatedInfo !== "object") {
      return NextResponse.json(
        { error: "Invalid related info data" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find and update the project
    const project = await Project.findByIdAndUpdate(
      projectId,
      { 
        $set: { 
          relatedInfo: {
            mondayBoardLink: relatedInfo.mondayBoardLink || "",
            ganttChartLink: relatedInfo.ganttChartLink || "",
            issueListLink: relatedInfo.issueListLink || "",
            sampleExcelSheetLink: relatedInfo.sampleExcelSheetLink || "",
            timeSheetLink: relatedInfo.timeSheetLink || "",
            github: {
              backendLink: relatedInfo.github?.backendLink || "",
              frontendLink: relatedInfo.github?.frontendLink || "",
              email: relatedInfo.github?.email || "",
              uid: relatedInfo.github?.uid || "",
              token: relatedInfo.github?.token || "",
              password: relatedInfo.github?.password || "",
              mainBranch: relatedInfo.github?.mainBranch || "main",
            },
            homePageLink: relatedInfo.homePageLink || "",
            adminPanel: {
              link: relatedInfo.adminPanel?.link || "",
              email: relatedInfo.adminPanel?.email || "",
              password: relatedInfo.adminPanel?.password || "",
            },
            notes: relatedInfo.notes || "",
            dynamicBoxes: relatedInfo.dynamicBoxes || [],
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Project related info updated successfully",
      relatedInfo: project.relatedInfo,
    });
  } catch (error) {
    console.error("Error updating project related info:", error);
    
    // Handle authentication errors
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
