const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedData() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'gelagle-stock-ims'
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Clear existing test data (keep the super admin)
    console.log('🧹 Clearing existing test data...');
    await client.query('DELETE FROM commissions');
    await client.query('DELETE FROM expenses'); 
    await client.query('DELETE FROM purchase_items');
    await client.query('DELETE FROM purchase_orders');
    await client.query('DELETE FROM payment_transactions');
    await client.query('DELETE FROM sales_items');
    await client.query('DELETE FROM sales');
    await client.query('DELETE FROM shop_products');
    await client.query('DELETE FROM warehouse_products');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM customers');
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM shops');
    await client.query('DELETE FROM warehouses');
    await client.query('DELETE FROM employees');
    await client.query('DELETE FROM users WHERE role != \'super_admin\'');
    await client.query('DELETE FROM companies');

    // Create companies
    console.log('🏢 Creating companies...');
    const companies = [];
    const companyData = [
      ['TechCorp Solutions', '123 Technology Ave, Silicon Valley, CA', '+1-555-0101', 'contact@techcorp.com', 'Leading technology solutions provider'],
      ['Global Retail Ltd', '456 Commerce St, New York, NY', '+1-555-0102', 'info@globalretail.com', 'International retail company'],
      ['Urban Fashion House', '789 Fashion Blvd, Los Angeles, CA', '+1-555-0103', 'hello@urbanfashion.com', 'Trendy fashion brand']
    ];

    for (const [name, address, phone, email, description] of companyData) {
      const result = await client.query(
        `INSERT INTO companies (id, name, address, "phoneNumber", email, description, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [name, address, phone, email, description]
      );
      companies.push({ id: result.rows[0].id, name });
      console.log(`  ✅ Created company: ${name}`);
    }

    // Create users and employees
    console.log('👥 Creating users and employees...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const users = [];
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      // Create company admin
      const adminEmail = `admin${i + 1}@${company.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;
      const userResult = await client.query(
        `INSERT INTO users (id, email, password, "firstName", "lastName", role, status, "isEmailVerified", "companyId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'company_admin', 'active', true, $5, NOW(), NOW()) RETURNING id`,
        [adminEmail, hashedPassword, `Admin${i + 1}`, 'User', company.id]
      );
      const userId = userResult.rows[0].id;
      users.push({ id: userId, email: adminEmail, companyId: company.id });

      // Create employee record for admin
      await client.query(
        `INSERT INTO employees (id, name, "phoneNumber", "jobTitle", "baseCommissionRate", "companyId", "userId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [`Admin${i + 1} User`, `+1-555-010${i + 1}`, 'Company Administrator', 5.0, company.id, userId]
      );

      // Create 4 more employees per company
      const employeeRoles = [
        { firstName: 'Manager1', lastName: `Company${i + 1}`, role: 'manager', jobTitle: 'Warehouse Manager', commission: 3.0 },
        { firstName: 'Manager2', lastName: `Company${i + 1}`, role: 'manager', jobTitle: 'Shop Manager', commission: 3.0 },
        { firstName: 'Sales1', lastName: `Company${i + 1}`, role: 'shop_employee', jobTitle: 'Sales Associate', commission: 2.0 },
        { firstName: 'Sales2', lastName: `Company${i + 1}`, role: 'shop_employee', jobTitle: 'Senior Sales Rep', commission: 2.5 }
      ];

      for (let j = 0; j < employeeRoles.length; j++) {
        const emp = employeeRoles[j];
        const email = `${emp.firstName.toLowerCase()}${emp.lastName.toLowerCase()}@example.com`;
        
        const empUserResult = await client.query(
          `INSERT INTO users (id, email, password, "firstName", "lastName", role, status, "isEmailVerified", "companyId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', true, $6, NOW(), NOW()) RETURNING id`,
          [email, hashedPassword, emp.firstName, emp.lastName, emp.role, company.id]
        );
        
        await client.query(
          `INSERT INTO employees (id, name, "phoneNumber", "jobTitle", "baseCommissionRate", "companyId", "userId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [`${emp.firstName} ${emp.lastName}`, `+1-555-${String(i * 100 + j + 20).padStart(4, '0')}`, emp.jobTitle, emp.commission, company.id, empUserResult.rows[0].id]
        );
        
        users.push({ id: empUserResult.rows[0].id, email, companyId: company.id });
      }
    }

    // Create warehouses
    console.log('🏪 Creating warehouses...');
    const warehouses = [];
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      for (let j = 0; j < 2; j++) {
        const result = await client.query(
          `INSERT INTO warehouses (id, name, location, description, capacity, "companyId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
          [`${company.name} Warehouse ${j + 1}`, `Industrial District ${j + 1}`, `Main storage facility`, 10000 + (j * 5000), company.id]
        );
        warehouses.push({ id: result.rows[0].id, companyId: company.id });
      }
    }

    // Create shops
    console.log('🛍️ Creating shops...');
    const shops = [];
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const companyWarehouses = warehouses.filter(w => w.companyId === company.id);
      
      for (let k = 0; k < 3; k++) {
        const result = await client.query(
          `INSERT INTO shops (id, name, location, "companyId", "warehouseId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [`${company.name} Store ${k + 1}`, `Shopping Mall ${k + 1}`, company.id, companyWarehouses[0].id]
        );
        shops.push({ id: result.rows[0].id, companyId: company.id });
      }
    }

    // Create suppliers
    console.log('📦 Creating suppliers...');
    const suppliers = [];
    const supplierNames = ['Tech Components Inc', 'Electronics Supply Co', 'Parts & Materials Ltd'];
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      for (let j = 0; j < 3; j++) {
        const result = await client.query(
          `INSERT INTO suppliers (id, name, contact, email, address, "companyId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
          [`${supplierNames[j]} - ${company.name}`, `+1-800-${String(i * 100 + j + 50).padStart(4, '0')}`, `contact${i}.${j}@${supplierNames[j].toLowerCase().replace(/\s+/g, '')}.com`, `Supplier Address ${j + 1}`, company.id]
        );
        suppliers.push({ id: result.rows[0].id, companyId: company.id });
      }
    }

    // Create products
    console.log('📱 Creating products...');
    const products = [];
    const productData = [
      ['Electronics', ['Laptop', 'Smartphone', 'Tablet', 'Headphones']],
      ['Clothing', ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers']],
      ['Home & Garden', ['Chair', 'Table', 'Lamp', 'Cushion']],
      ['Sports', ['Basketball', 'Tennis Racket', 'Yoga Mat', 'Dumbbell']]
    ];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      for (const [category, items] of productData) {
        for (const item of items) {
          const basePrice = Math.floor(Math.random() * 400) + 100; // $100-$500
          const result = await client.query(
            `INSERT INTO products (id, name, description, sku, price, cost, category, unit, type, "stockQuantity", "minStockLevel", "taxRate", "commissionRate", "companyId", "createdAt", "updatedAt") 
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id`,
            [
              `${item} - ${company.name}`,
              `High quality ${item.toLowerCase()}`,
              `SKU-${i}${category.substring(0,3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              basePrice,
              basePrice * 0.7, // cost
              category,
              'piece',
              'product',
              Math.floor(Math.random() * 500) + 100, // stock
              Math.floor(Math.random() * 20) + 10, // min stock
              [5, 10, 15][Math.floor(Math.random() * 3)], // tax rate
              [2, 3, 4][Math.floor(Math.random() * 3)], // commission rate
              company.id
            ]
          );
          products.push({ id: result.rows[0].id, companyId: company.id, price: basePrice, cost: basePrice * 0.7 });
        }
      }
    }

    // Create customers
    console.log('🛒 Creating customers...');
    const customers = [];
    const customerNames = ['John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'Robert Wilson'];
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      for (let j = 0; j < customerNames.length; j++) {
        const result = await client.query(
          `INSERT INTO customers (id, name, "phoneNumber", address, "creditLimit", "currentCreditBalance", "interestRate", "companyId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
          [
            customerNames[j],
            `${i}${j}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`.slice(-10),
            `${j + 100} Customer St, City ${i + 1}`,
            Math.floor(Math.random() * 5000) + 2000, // credit limit
            Math.floor(Math.random() * 1000), // current balance
            [3, 4, 5][Math.floor(Math.random() * 3)], // interest rate
            company.id
          ]
        );
        customers.push({ id: result.rows[0].id, companyId: company.id });
      }
    }

    // Create sales
    console.log('💰 Creating sales...');
    const paymentTypes = ['cash', 'credit', 'debit', 'online'];
    
    for (let i = 0; i < 30; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const companyWarehouses = warehouses.filter(w => w.companyId === company.id);
      const companyShops = shops.filter(s => s.companyId === company.id);
      const companyCustomers = customers.filter(c => c.companyId === company.id);
      const companyProducts = products.filter(p => p.companyId === company.id);
      const companyUsers = users.filter(u => u.companyId === company.id);
      
      if (companyCustomers.length === 0 || companyProducts.length === 0) continue;

      const warehouse = companyWarehouses[Math.floor(Math.random() * companyWarehouses.length)];
      const shop = Math.random() > 0.5 ? companyShops[Math.floor(Math.random() * companyShops.length)] : null;
      const customer = companyCustomers[Math.floor(Math.random() * companyCustomers.length)];
      const user = companyUsers[Math.floor(Math.random() * companyUsers.length)];
      const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
      
      // Create sale date within last 3 months
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));
      
      const saleResult = await client.query(
        `INSERT INTO sales (id, "totalAmount", "taxAmount", "advancePayment", "remainingBalance", "saleDate", "paymentType", status, note, "subtotal", "discountAmount", "customerId", "warehouseId", shop_id, created_by) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [0, 0, 0, 0, saleDate, paymentType, 'completed', `Test sale #${i + 1}`, 0, 0, customer.id, warehouse.id, shop?.id || null, user.id]
      );
      const saleId = saleResult.rows[0].id;
      
      // Add 1-3 items to each sale
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0, taxAmount = 0, subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = companyProducts[Math.floor(Math.random() * companyProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.price;
        const itemSubtotal = unitPrice * quantity;
        const itemTaxAmount = itemSubtotal * 0.1; // 10% tax
        const itemTotal = itemSubtotal + itemTaxAmount;
        
        await client.query(
          `INSERT INTO sales_items (id, quantity, "unitPrice", subtotal, "taxRate", "taxAmount", "discountAmount", total, sales_id, product_id) 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [quantity, unitPrice, itemSubtotal, 10, itemTaxAmount, 0, itemTotal, saleId, product.id]
        );
        
        subtotal += itemSubtotal;
        taxAmount += itemTaxAmount;
        totalAmount += itemTotal;
      }
      
      // Update sale totals
      await client.query(
        `UPDATE sales SET "totalAmount" = $1, "taxAmount" = $2, subtotal = $3, "advancePayment" = $4, "remainingBalance" = $5 WHERE id = $6`,
        [totalAmount, taxAmount, subtotal, paymentType === 'credit' ? totalAmount * 0.5 : totalAmount, paymentType === 'credit' ? totalAmount * 0.5 : 0, saleId]
      );
      
      // Create payment transaction
      await client.query(
        `INSERT INTO payment_transactions (id, amount, "paymentMethod", "transactionType", "transactionReference", notes, "transactionDate", "isSuccessful", sale_id, processed_by) 
         VALUES (gen_random_uuid(), $1, $2, 'sale', $3, $4, $5, true, $6, $7)`,
        [
          paymentType === 'credit' ? totalAmount * 0.5 : totalAmount,
          paymentType,
          `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          paymentType === 'credit' ? 'Partial payment' : 'Full payment',
          saleDate,
          saleId,
          user.id
        ]
      );

      if (i % 10 === 9) {
        console.log(`  ✅ Created ${i + 1}/30 sales...`);
      }
    }

    // Create purchase orders
    console.log('📦 Creating purchase orders...');
    for (let i = 0; i < 20; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const companySuppliers = suppliers.filter(s => s.companyId === company.id);
      const companyWarehouses = warehouses.filter(w => w.companyId === company.id);
      const companyProducts = products.filter(p => p.companyId === company.id);
      const companyUsers = users.filter(u => u.companyId === company.id);
      
      if (companySuppliers.length === 0 || companyProducts.length === 0) continue;

      const supplier = companySuppliers[Math.floor(Math.random() * companySuppliers.length)];
      const warehouse = companyWarehouses[Math.floor(Math.random() * companyWarehouses.length)];
      const user = companyUsers[Math.floor(Math.random() * companyUsers.length)];
      
      // Create purchase date within last 2 months
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 60));
      
      const purchaseResult = await client.query(
        `INSERT INTO purchase_orders (id, "poNumber", "totalAmount", "taxAmount", subtotal, "orderDate", status, notes, "supplier_id", "warehouse_id", "created_by", "company_id", "remainingAmount", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id`,
        [`PO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`, 0, 0, 0, purchaseDate, 'draft', `Purchase order #${i + 1}`, supplier.id, warehouse.id, user.id, company.id, 0]
      );
      const purchaseId = purchaseResult.rows[0].id;
      
      // Add 2-5 items to each purchase order (ensure unique products)
      const itemCount = Math.min(Math.floor(Math.random() * 4) + 2, companyProducts.length);
      let totalAmount = 0, taxAmount = 0;
      const usedProducts = new Set();
      
      for (let j = 0; j < itemCount; j++) {
        let product;
        let attempts = 0;
        // Find a product that hasn't been used in this order
        do {
          product = companyProducts[Math.floor(Math.random() * companyProducts.length)];
          attempts++;
        } while (usedProducts.has(product.id) && attempts < 50);
        
        if (usedProducts.has(product.id)) {
          continue; // Skip if we can't find a unique product
        }
        
        usedProducts.add(product.id);
        const quantity = Math.floor(Math.random() * 20) + 5;
        const unitPrice = product.cost; // Use cost price for purchases
        const itemSubtotal = unitPrice * quantity;
        const itemTaxAmount = itemSubtotal * 0.05; // 5% tax
        const itemTotal = itemSubtotal + itemTaxAmount;
        
        await client.query(
          `INSERT INTO purchase_items (id, quantity, "unitCost", "totalCost", "purchase_order_id", "product_id", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())`,
          [quantity, unitPrice, itemTotal, purchaseId, product.id]
        );
        
        totalAmount += itemTotal;
        taxAmount += itemTaxAmount;
      }
      
      // Update purchase order totals
      await client.query(
        `UPDATE purchase_orders SET "totalAmount" = $1, "taxAmount" = $2 WHERE id = $3`,
        [totalAmount, taxAmount, purchaseId]
      );

      if (i % 10 === 9) {
        console.log(`  ✅ Created ${i + 1}/20 purchase orders...`);
      }
    }

    // Create expenses
    console.log('💸 Creating expenses...');
    const expenseTypes = ['office_supplies', 'marketing', 'travel', 'utilities', 'rent', 'insurance'];
    const expenseCategories = ['fixed_cost', 'variable_cost', 'direct_cost'];
    const paymentMethods = ['cash', 'credit_card', 'bank_transfer', 'check'];
    
    for (let i = 0; i < 25; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const companyUsers = users.filter(u => u.companyId === company.id);
      
      const user = companyUsers[Math.floor(Math.random() * companyUsers.length)];
      const type = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Create expense date within last 3 months
      const expenseDate = new Date();
      expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 90));
      
      const amount = Math.floor(Math.random() * 1000) + 50; // $50-$1050
      const taxRate = 0.1;
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;
      const expenseNumber = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}-${i}`;
      
      await client.query(
        `INSERT INTO expenses (id, "expenseNumber", title, description, type, category, amount, "taxRate", "taxAmount", "totalAmount", "expenseDate", "paymentMethod", status, "isReimbursable", "isTaxDeductible", recurrence, "submitted_by", "company_id", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
        [expenseNumber, `${type.replace('_', ' ')} expense`, `${type.replace('_', ' ')} expense for company operations`, type, category, amount, taxRate * 100, taxAmount, totalAmount, expenseDate, paymentMethod, 'approved', false, true, 'one_time', user.id, company.id]
      );

      if (i % 10 === 9) {
        console.log(`  ✅ Created ${i + 1}/25 expenses...`);
      }
    }

    // Create commissions for sales
    console.log('💰 Creating commissions...');
    const salesResults = await client.query(
      'SELECT id, "totalAmount", created_by FROM sales ORDER BY "createdAt"'
    );
    
    for (const sale of salesResults.rows) {
      // Get employee record for the user who created the sale
      const employeeResult = await client.query(
        'SELECT id, "baseCommissionRate" FROM employees WHERE "userId" = $1 LIMIT 1',
        [sale.created_by]
      );
      
      if (employeeResult.rows.length === 0) continue;
      
      const employee = employeeResult.rows[0];
      const commissionRate = employee.baseCommissionRate || 2.0;
      const commissionAmount = (sale.totalAmount * commissionRate) / 100;
      
      await client.query(
        `INSERT INTO commissions (id, amount, "commissionDate", "commissionRate", "commissionAmount", "isApproved", "saleId", "employeeId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, NOW(), $2, $3, $4, $5, $6, NOW(), NOW())`,
        [sale.totalAmount, commissionRate, commissionAmount, true, sale.id, employee.id]
      );
    }

    console.log('✅ Data seeding completed successfully!');
    console.log(`
📊 Summary of seeded data:
• ${companies.length} companies
• ${users.length} users with employee records
• ${warehouses.length} warehouses
• ${shops.length} shops
• ${suppliers.length} suppliers
• ${products.length} products
• ${customers.length} customers
• 30 sales with items and payment transactions
• 20 purchase orders with items
• 25 expenses across multiple categories
• Commission records for all sales

🔑 Test Login Credentials:
• admin1@techcorpsolutions.com / password123
• admin2@globalretailltd.com / password123  
• admin3@urbanfashionhouse.com / password123
`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

seedData().catch(console.error);