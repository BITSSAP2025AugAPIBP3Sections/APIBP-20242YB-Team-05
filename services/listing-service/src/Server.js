const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

const app = express();
app.use(express.json());

const ajv = new Ajv({ allErrors: true });

// Load API spec
const specPath = path.resolve(__dirname, '../../../apispec/listing-api.yaml'); // adjust path to your actual location
const apiSpec = yaml.load(fs.readFileSync(specPath, 'utf8'));

// In-memory storage
const listings = [];
let idCounter = 1;

// Helper: Validate request body against a schema
function validateRequest(schema) {
  if (!schema) return (req, res, next) => next();
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validate(req.body);
    if (!valid) return res.status(400).json({ errors: validate.errors });
    next();
  };
}

// Register routes dynamically
Object.entries(apiSpec.paths).forEach(([route, methods]) => {
  Object.entries(methods).forEach(([method, details]) => {
    const expressRoute = route.replace(/{(\w+)}/g, ':$1');
    const schemaRef = details.requestBody?.content?.['application/json']?.schema?.$ref;
    let schema = null;

    if (schemaRef) {
      const schemaName = schemaRef.replace('#/components/schemas/', '');
      schema = apiSpec.components.schemas[schemaName];
    }

    app[method](expressRoute, validateRequest(schema), (req, res) => {
      const { listingId } = req.params;

      switch (method) {
        case 'get':
          if (listingId) {
            const listing = listings.find(l => l.listingId === listingId);
            return listing ? res.json(listing) : res.status(404).json({ error: 'Listing not found' });
          }
          return res.json({ listings, pagination: { currentPage: 1, totalPages: 1, totalResults: listings.length, resultsPerPage: 20 } });

        case 'post':
          if (details.operationId === 'publishListing') {
            const listing = listings.find(l => l.listingId === listingId);
            if (!listing) return res.status(404).json({ error: 'Listing not found' });
            if (listing.status === 'published') return res.status(409).json({ error: 'Already published' });
            listing.status = 'published';
            return res.json(listing);
          } else {
            const newListing = {
              listingId: `lst_${idCounter++}`,
              ...req.body,
              currency: req.body.currency || 'ETH',
              stock: req.body.stock || 0,
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            listings.push(newListing);
            return res.status(201).json(newListing);
          }

        case 'put':
          const indexToUpdate = listings.findIndex(l => l.listingId === listingId);
          if (indexToUpdate === -1) return res.status(404).json({ error: 'Listing not found' });
          listings[indexToUpdate] = {
            ...listings[indexToUpdate],
            ...req.body,
            updatedAt: new Date().toISOString(),
          };
          return res.json(listings[indexToUpdate]);

        case 'delete':
          const indexToDelete = listings.findIndex(l => l.listingId === listingId);
          if (indexToDelete === -1) return res.status(404).json({ error: 'Listing not found' });
          listings.splice(indexToDelete, 1);
          return res.status(204).send();

        default:
          return res.status(501).json({ error: 'Not implemented' });
      }
    });
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
