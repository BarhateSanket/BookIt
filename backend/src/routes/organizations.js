const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');

// Middleware to check organization access
const checkOrganizationAccess = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user has access to this organization
    if (!user.canAccessOrganization(organizationId)) {
      return res.status(403).json({ message: 'Access denied to this organization' });
    }

    req.organizationId = organizationId;
    req.userRole = user.getRoleForOrganization(organizationId);
    req.userPermissions = user.roles.find(r =>
      r.organization.toString() === organizationId
    )?.permissions || [];

    next();
  } catch (error) {
    console.error('Organization access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check specific permissions
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ message: `Permission denied: ${requiredPermission}` });
    }
    next();
  };
};

// Create organization
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, contact } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if slug is available
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization slug already exists' });
    }

    const organization = new Organization({
      name,
      slug,
      description,
      owner: ownerId,
      contact
    });

    await organization.save();

    // Add owner role to user
    const user = await User.findById(ownerId);
    user.roles.push({
      organization: organization._id,
      role: 'owner',
      permissions: [
        'manage_organization',
        'manage_users',
        'manage_experiences',
        'manage_bookings',
        'view_analytics',
        'manage_billing',
        'manage_integrations'
      ]
    });
    await user.save();

    res.status(201).json({
      success: true,
      organization
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Organization name or slug already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Get user's organizations
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId).populate('roles.organization');
    const organizations = user.roles.map(role => ({
      ...role.organization.toObject(),
      userRole: role.role,
      userPermissions: role.permissions
    }));

    res.json({
      success: true,
      organizations
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organization by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const organization = await Organization.findBySlug(req.params.slug);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        branding: organization.getBrandingConfig(),
        settings: organization.settings
      }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organization details (authenticated)
router.get('/:organizationId', checkOrganizationAccess, async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId)
      .populate('owner', 'name email');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      success: true,
      organization,
      userRole: req.userRole,
      userPermissions: req.userPermissions
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update organization
router.put('/:organizationId', checkOrganizationAccess, checkPermission('manage_organization'), async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const updateFields = [
      'name', 'description', 'contact', 'settings'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        organization[field] = req.body[field];
      }
    });

    // Handle branding updates
    if (req.body.branding) {
      organization.branding = { ...organization.branding, ...req.body.branding };
    }

    await organization.save();

    res.json({
      success: true,
      organization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update branding
router.put('/:organizationId/branding', checkOrganizationAccess, checkPermission('manage_organization'), async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    organization.branding = { ...organization.branding, ...req.body };
    await organization.save();

    res.json({
      success: true,
      branding: organization.getBrandingConfig()
    });

  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organization members
router.get('/:organizationId/members', checkOrganizationAccess, async (req, res) => {
  try {
    const users = await User.find({
      'roles.organization': req.organizationId
    }).select('name email avatar roles');

    const members = users.map(user => {
      const orgRole = user.roles.find(r =>
        r.organization.toString() === req.organizationId
      );
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: orgRole.role,
        permissions: orgRole.permissions,
        joinedAt: orgRole.assignedAt
      };
    });

    res.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to organization
router.post('/:organizationId/members', checkOrganizationAccess, checkPermission('manage_users'), async (req, res) => {
  try {
    const { email, role, permissions } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    if (user.canAccessOrganization(req.organizationId)) {
      return res.status(400).json({ message: 'User is already a member of this organization' });
    }

    user.roles.push({
      organization: req.organizationId,
      role: role || 'viewer',
      permissions: permissions || []
    });

    await user.save();

    res.json({
      success: true,
      message: 'Member added successfully',
      member: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role || 'viewer',
        permissions: permissions || []
      }
    });

  } catch (error) {
    console.error('Error adding organization member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update member role
router.put('/:organizationId/members/:userId', checkOrganizationAccess, checkPermission('manage_users'), async (req, res) => {
  try {
    const { role, permissions } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const orgRoleIndex = user.roles.findIndex(r =>
      r.organization.toString() === req.organizationId
    );

    if (orgRoleIndex === -1) {
      return res.status(404).json({ message: 'User is not a member of this organization' });
    }

    user.roles[orgRoleIndex].role = role;
    user.roles[orgRoleIndex].permissions = permissions;

    await user.save();

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from organization
router.delete('/:organizationId/members/:userId', checkOrganizationAccess, checkPermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.roles = user.roles.filter(r =>
      r.organization.toString() !== req.organizationId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing organization member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organization statistics
router.get('/:organizationId/stats', checkOrganizationAccess, async (req, res) => {
  try {
    const [experienceCount, bookingCount, userCount, revenueStats] = await Promise.all([
      Experience.countDocuments({ organization: req.organizationId }),
      Booking.countDocuments({
        experience: { $in: await Experience.find({ organization: req.organizationId }).distinct('_id') }
      }),
      User.countDocuments({ 'roles.organization': req.organizationId }),
      Booking.aggregate([
        {
          $lookup: {
            from: 'experiences',
            localField: 'experience',
            foreignField: '_id',
            as: 'experience'
          }
        },
        { $unwind: '$experience' },
        { $match: { 'experience.organization': require('mongoose').Types.ObjectId(req.organizationId) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalBookings: { $sum: 1 }
          }
        }
      ])
    ]);

    const revenue = revenueStats.length > 0 ? revenueStats[0] : { totalRevenue: 0, totalBookings: 0 };

    res.json({
      success: true,
      stats: {
        experiences: experienceCount,
        bookings: bookingCount,
        users: userCount,
        revenue: revenue.totalRevenue,
        averageBookingValue: bookingCount > 0 ? revenue.totalRevenue / bookingCount : 0
      }
    });

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;