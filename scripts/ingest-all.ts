import 'dotenv/config';
import { ingestECFR } from './ingest-ecfr';
import { ingestFederalRegister } from './ingest-federal-register';
import { getOrCreateCollection, LEGAL_COLLECTION } from '../lib/rag/chroma';

async function ingestAll() {
  console.log('========================================');
  console.log('  Elle Legal Document Ingestion');
  console.log('========================================\n');

  const startTime = Date.now();
  let ecfrCount = 0;
  let frCount = 0;

  // 1. eCFR Federal Regulations
  try {
    ecfrCount = await ingestECFR();
  } catch (error) {
    console.error('eCFR ingestion failed:', error);
  }

  // 2. Federal Register
  try {
    frCount = await ingestFederalRegister();
  } catch (error) {
    console.error('Federal Register ingestion failed:', error);
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Verify collection count
  try {
    const collection = await getOrCreateCollection(LEGAL_COLLECTION);
    const count = await collection.count();
    console.log('\n========================================');
    console.log('  Ingestion Summary');
    console.log('========================================');
    console.log(`  eCFR chunks:              ${ecfrCount}`);
    console.log(`  Federal Register chunks:  ${frCount}`);
    console.log(`  Total in collection:      ${count}`);
    console.log(`  Time elapsed:             ${elapsed}s`);
    console.log('========================================\n');
  } catch (error) {
    console.log('\n========================================');
    console.log('  Ingestion Summary');
    console.log('========================================');
    console.log(`  eCFR chunks:              ${ecfrCount}`);
    console.log(`  Federal Register chunks:  ${frCount}`);
    console.log(`  Time elapsed:             ${elapsed}s`);
    console.log('========================================\n');
  }
}

ingestAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
