# What's In It - Product Service

## Functions

* addProductUpdate - POST - add an entry into the product update database
* getByCode - GET - retrieves a product by it's barcode
* scrollSearch - GET - (VPC) retrieves product search results from elasticsearch using scroll index
* searchText - POST - (VPC) retrieves product search results from elasticsearch
* searchCategory (unused) - retrieves products from dynamodb using category field (SLOW)
