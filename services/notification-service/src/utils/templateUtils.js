import Handlebars from 'handlebars';

/**
 * Compile Handlebars template with data
 */
export const compileTemplate = (template, data) => {
  try {
    if (!template) return '';

    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    console.error('Error compiling template:', error);
    return template; // Return original template on error
  }
};

/**
 * Register custom Handlebars helpers
 */
export const registerTemplateHelpers = () => {
  // Date formatting helper
  Handlebars.registerHelper('formatDate', function(date, format) {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

    // Simple date formatting (you might want to use a proper date library)
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return d.toLocaleDateString('en-US', options);
  });

  // Currency formatting helper
  Handlebars.registerHelper('formatCurrency', function(amount, currency = 'INR') {
    if (typeof amount !== 'number') return amount;

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  });

  // Uppercase helper
  Handlebars.registerHelper('uppercase', function(str) {
    return str ? str.toUpperCase() : '';
  });

  // Lowercase helper
  Handlebars.registerHelper('lowercase', function(str) {
    return str ? str.toLowerCase() : '';
  });

  // Capitalize helper
  Handlebars.registerHelper('capitalize', function(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  });

  // Truncate helper
  Handlebars.registerHelper('truncate', function(str, length) {
    if (!str || !length) return str;
    return str.length > length ? str.substring(0, length) + '...' : str;
  });

  // Default value helper
  Handlebars.registerHelper('default', function(value, defaultValue) {
    return value || defaultValue;
  });

  // Equality helper
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Not equality helper
  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });

  // Greater than helper
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  // Less than helper
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  // And helper
  Handlebars.registerHelper('and', function(a, b) {
    return a && b;
  });

  // Or helper
  Handlebars.registerHelper('or', function(a, b) {
    return a || b;
  });

  // Not helper
  Handlebars.registerHelper('not', function(value) {
    return !value;
  });

  console.log('📝 Template helpers registered');
};

/**
 * Validate template variables
 */
export const validateTemplate = (template, requiredVariables = []) => {
  try {
    if (!template) return { valid: false, error: 'Template is empty' };

    // Try to compile the template
    const compiled = Handlebars.compile(template);

    // Check for required variables
    const missingVariables = [];
    for (const variable of requiredVariables) {
      if (!template.includes(`{{${variable}}}`) && !template.includes(`{{${variable}}}`)) {
        missingVariables.push(variable);
      }
    }

    return {
      valid: missingVariables.length === 0,
      missingVariables,
      compiled
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Preview template with sample data
 */
export const previewTemplate = (template, sampleData = {}) => {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(sampleData);
  } catch (error) {
    return `Template Error: ${error.message}`;
  }
};

// Initialize helpers when module is loaded
registerTemplateHelpers();
