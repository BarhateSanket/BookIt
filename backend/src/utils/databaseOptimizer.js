const mongoose = require('mongoose');

class DatabaseOptimizer {
  constructor() {
    this.optimizationInterval = setInterval(() => this.runOptimizations(), 24 * 60 * 60 * 1000); // Daily
  }

  // Run all database optimizations
  async runOptimizations() {
    try {
      console.log('Running database optimizations...');

      await Promise.all([
        this.optimizeIndexes(),
        this.analyzeQueryPerformance(),
        this.cleanupOldData(),
        this.updateStatistics()
      ]);

      console.log('Database optimizations completed');
    } catch (error) {
      console.error('Database optimization error:', error);
    }
  }

  // Optimize database indexes
  async optimizeIndexes() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();

      for (const collection of collections) {
        const coll = db.collection(collection.name);

        // Analyze index usage
        const indexStats = await coll.aggregate([
          { $indexStats: {} }
        ]).toArray();

        // Remove unused indexes (be careful in production!)
        const unusedIndexes = indexStats.filter(stat =>
          stat.accesses.ops === 0 && !stat.name.startsWith('_id_')
        );

        for (const index of unusedIndexes) {
          console.log(`Dropping unused index: ${index.name} on ${collection.name}`);
          await coll.dropIndex(index.name);
        }

        // Rebuild indexes if needed
        await coll.reIndex();
      }

      console.log('Index optimization completed');
    } catch (error) {
      console.error('Index optimization error:', error);
    }
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    try {
      const db = mongoose.connection.db;

      // Enable profiling temporarily
      await db.setProfilingLevel(2, { slowms: 100 }); // Profile queries slower than 100ms

      // Wait a bit for some queries to be profiled
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get slow queries
      const systemProfile = db.collection('system.profile');
      const slowQueries = await systemProfile.find({
        ts: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }).sort({ ts: -1 }).limit(10).toArray();

      // Analyze and suggest optimizations
      for (const query of slowQueries) {
        await this.analyzeSlowQuery(query);
      }

      // Disable profiling
      await db.setProfilingLevel(0);

      console.log('Query performance analysis completed');
    } catch (error) {
      console.error('Query performance analysis error:', error);
    }
  }

  // Analyze a slow query and suggest optimizations
  async analyzeSlowQuery(query) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(query.ns.split('.')[1]);

      // Check if query is using indexes
      const explain = await collection.find(query.command.filter || {}).explain('executionStats');

      if (explain.executionStats.totalDocsExamined > explain.executionStats.totalDocsReturned * 10) {
        console.log(`Slow query detected on ${query.ns}:`);
        console.log(`- Execution time: ${explain.executionStats.executionTimeMillis}ms`);
        console.log(`- Documents examined: ${explain.executionStats.totalDocsExamined}`);
        console.log(`- Documents returned: ${explain.executionStats.totalDocsReturned}`);
        console.log(`- Index used: ${explain.executionStats.winningPlan?.inputStage?.indexName || 'None'}`);
        console.log('Consider adding an index for this query pattern');
      }
    } catch (error) {
      console.error('Error analyzing slow query:', error);
    }
  }

  // Clean up old data
  async cleanupOldData() {
    try {
      const db = mongoose.connection.db;

      // Clean up old audit logs (keep last 7 years for compliance)
      const auditLogCollection = db.collection('auditlogs');
      const sevenYearsAgo = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000);
      const auditCleanup = await auditLogCollection.deleteMany({
        timestamp: { $lt: sevenYearsAgo }
      });

      // Clean up old sessions (keep last 30 days)
      const sessionCollection = db.collection('sessions');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sessionCleanup = await sessionCollection.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      // Clean up old notifications (keep last 90 days)
      const notificationCollection = db.collection('notifications');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const notificationCleanup = await notificationCollection.deleteMany({
        createdAt: { $lt: ninetyDaysAgo }
      });

      console.log(`Cleanup completed: ${auditCleanup.deletedCount} audit logs, ${sessionCleanup.deletedCount} sessions, ${notificationCleanup.deletedCount} notifications`);
    } catch (error) {
      console.error('Data cleanup error:', error);
    }
  }

  // Update database statistics
  async updateStatistics() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();

      // Store statistics in a collection for monitoring
      const statsCollection = db.collection('database_stats');
      await statsCollection.insertOne({
        timestamp: new Date(),
        stats: stats,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      });

      // Keep only last 30 days of stats
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await statsCollection.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });

      console.log('Database statistics updated');
    } catch (error) {
      console.error('Statistics update error:', error);
    }
  }

  // Create optimized indexes for common queries
  async createOptimizedIndexes() {
    try {
      const Experience = require('../models/Experience');
      const User = require('../models/User');
      const Booking = require('../models/Booking');
      const Review = require('../models/Review');
      const AuditLog = require('../models/AuditLog');

      // Experience indexes
      await Experience.collection.createIndex(
        { organization: 1, isActive: 1, category: 1 },
        { name: 'experience_org_active_category' }
      );

      await Experience.collection.createIndex(
        { organization: 1, location: 1, price: 1 },
        { name: 'experience_org_location_price' }
      );

      // User indexes
      await User.collection.createIndex(
        { organization: 1, email: 1 },
        { name: 'user_org_email', unique: true }
      );

      await User.collection.createIndex(
        { 'roles.organization': 1 },
        { name: 'user_roles_org' }
      );

      // Booking indexes
      await Booking.collection.createIndex(
        { user: 1, createdAt: -1 },
        { name: 'booking_user_created' }
      );

      await Booking.collection.createIndex(
        { experience: 1, slotDate: 1, slotTime: 1 },
        { name: 'booking_experience_slot' }
      );

      // Review indexes
      await Review.collection.createIndex(
        { experience: 1, moderation: 1, createdAt: -1 },
        { name: 'review_experience_moderation_created' }
      );

      // Audit log indexes (already defined in model)
      await AuditLog.collection.createIndex(
        { organization: 1, action: 1, timestamp: -1 },
        { name: 'audit_org_action_timestamp' }
      );

      console.log('Optimized indexes created');
    } catch (error) {
      console.error('Index creation error:', error);
    }
  }

  // Database connection pooling optimization
  optimizeConnectionPool() {
    // Set optimal connection pool size
    const maxPoolSize = process.env.NODE_ENV === 'production' ? 10 : 5;
    const minPoolSize = 2;

    mongoose.set('maxPoolSize', maxPoolSize);
    mongoose.set('minPoolSize', minPoolSize);
    mongoose.set('maxIdleTimeMS', 30000);
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);

    console.log(`Database connection pool optimized: min=${minPoolSize}, max=${maxPoolSize}`);
  }

  // Query result caching hints
  addCachingHints(query, ttl = 300) { // 5 minutes default
    return query.hint({ $maxTimeMS: 5000 }) // 5 second timeout
                 .maxTimeMS(5000)
                 .readPreference('secondaryPreferred'); // Read from secondary if available
  }

  // Bulk operations optimization
  async performBulkOperation(operations, options = {}) {
    const session = await mongoose.startSession();

    try {
      let result = { modifiedCount: 0, insertedCount: 0, deletedCount: 0 };

      await session.withTransaction(async () => {
        for (const operation of operations) {
          switch (operation.type) {
            case 'insert':
              const inserted = await operation.model.insertMany(operation.documents, { session });
              result.insertedCount += inserted.length;
              break;
            case 'update':
              const updated = await operation.model.updateMany(operation.filter, operation.update, {
                session,
                ...options
              });
              result.modifiedCount += updated.modifiedCount;
              break;
            case 'delete':
              const deleted = await operation.model.deleteMany(operation.filter, { session });
              result.deletedCount += deleted.deletedCount;
              break;
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Bulk operation error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Database backup utility
  async createBackup(backupPath) {
    try {
      const db = mongoose.connection.db;
      const fs = require('fs').promises;
      const path = require('path');

      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Get all collections
      const collections = await db.listCollections().toArray();

      for (const collection of collections) {
        const coll = db.collection(collection.name);
        const documents = await coll.find({}).toArray();

        if (documents.length > 0) {
          const filePath = path.join(backupPath, `${collection.name}.json`);
          await fs.writeFile(filePath, JSON.stringify(documents, null, 2));
        }
      }

      console.log(`Database backup created at ${backupPath}`);
      return { success: true, path: backupPath };
    } catch (error) {
      console.error('Backup creation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get database performance metrics
  async getPerformanceMetrics() {
    try {
      const db = mongoose.connection.db;

      // Get database stats
      const stats = await db.stats();

      // Get slow queries from profiling
      const systemProfile = db.collection('system.profile');
      const slowQueries = await systemProfile.countDocuments({
        millis: { $gt: 100 } // Queries taking more than 100ms
      });

      // Get connection stats
      const serverStatus = await db.serverStatus();

      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
        slowQueries,
        connections: serverStatus.connections,
        opcounters: serverStatus.opcounters,
        globalLock: serverStatus.globalLock,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Performance metrics error:', error);
      return { error: error.message };
    }
  }

  // Shutdown
  shutdown() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    console.log('Database optimizer shut down');
  }
}

module.exports = new DatabaseOptimizer();