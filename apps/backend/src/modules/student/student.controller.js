
import {
  getPublishedCourses,
  getPublishedCourseById,
  getStudentProfile,
  updateStudentProfile,
  getStudentOptions,
  getStudentPathways,
  createStudentPathway,
  updateStudentPathway,
  deleteStudentPathway
} from './student.service.js';


// ------------------------------------------
// EXISTING: Course APIs
// ------------------------------------------

export async function listPublishedCourses(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const result = await getPublishedCourses(page, limit);

    return res.status(200).json({
      success: true,
      message: 'Published courses fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Student course catalog error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to fetch published courses'
    });
  }
}

export async function getPublishedCourse(req, res) {
  try {
    const course = await getPublishedCourseById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Course details fetched successfully',
      data: course
    });
  } catch (error) {
    console.error('Student course detail error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to fetch course details'
    });
  }
}

// ------------------------------------------
// NEW: Student profile APIs
// ------------------------------------------

export async function getProfile(req, res) {
  try {
    const profile = await getStudentProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Student profile fetched successfully',
      data: { profile }
    });
  } catch (error) {
    console.error('Student profile fetch error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to fetch student profile'
    });
  }
}

export async function saveProfile(req, res) {
  try {
    const allowedFields = [
      'educationLevelCode',
      'boardCode',
      'gradeLevel',
      'dateOfBirth',
      'preferredLanguage'
    ];

    const invalidFields = Object.keys(req.body || {}).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported profile fields: ${invalidFields.join(', ')}`
      });
    }

    const profile = await updateStudentProfile(
      req.user.id,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: { profile }
    });
  } catch (error) {
    console.error('Student profile update error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to update student profile'
    });
  }
}

export async function listStudentOptions(req, res) {
  try {
    const options = await getStudentOptions();

    return res.status(200).json({
      success: true,
      message: 'Student education options fetched successfully',
      data: options
    });
  } catch (error) {
    console.error('Student options error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch student education options'
    });
  }
}


/* ==========================================
   STUDENT PATHWAY CONTROLLERS
========================================== */

// GET all pathways
export async function listPathways(req, res) {
  try {
    const pathways = await getStudentPathways(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Student pathways fetched successfully',
      data: { pathways }
    });
  } catch (error) {
    console.error('List pathways error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to fetch student pathways'
    });
  }
}

// ADD pathway
export async function addPathway(req, res) {
  try {
    const pathway = await createStudentPathway(
      req.user.id,
      req.body || {}
    );

    return res.status(201).json({
      success: true,
      message: 'Student pathway created successfully',
      data: { pathway }
    });
  } catch (error) {
    console.error('Create pathway error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to create student pathway'
    });
  }
}

// UPDATE pathway
export async function editPathway(req, res) {
  try {
    const pathway = await updateStudentPathway(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Student pathway updated successfully',
      data: { pathway }
    });
  } catch (error) {
    console.error('Update pathway error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to update student pathway'
    });
  }
}

// DELETE pathway
export async function removePathway(req, res) {
  try {
    await deleteStudentPathway(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'Student pathway deleted successfully'
    });
  } catch (error) {
    console.error('Delete pathway error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to delete student pathway'
    });
  }
}
