import {
  createCreatorResource,
  getCreatorResources,
  updateCreatorResource,
  deleteCreatorResource
} from './creator-resources.service.js';

function handleError(res, error, label) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(`${label}:`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'Unable to process resource request'
      : error.message
  });
}

export async function createResource(req, res) {
  try {
    const resource = await createCreatorResource(
      req.user.id,
      req.params.lessonId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource
    });
  } catch (error) {
    return handleError(res, error, 'Create resource error');
  }
}

export async function listResources(req, res) {
  try {
    const resources = await getCreatorResources(
      req.user.id,
      req.params.lessonId
    );

    return res.status(200).json({
      success: true,
      message: 'Resources fetched successfully',
      data: resources
    });
  } catch (error) {
    return handleError(res, error, 'List resources error');
  }
}

export async function updateResource(req, res) {
  try {
    const resource = await updateCreatorResource(
      req.user.id,
      req.params.resourceId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: resource
    });
  } catch (error) {
    return handleError(res, error, 'Update resource error');
  }
}

export async function deleteResource(req, res) {
  try {
    const resource = await deleteCreatorResource(
      req.user.id,
      req.params.resourceId
    );

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
      data: resource
    });
  } catch (error) {
    return handleError(res, error, 'Delete resource error');
  }
}
