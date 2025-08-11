#!/usr/bin/env node

/**
 * 🔧 Correction des Preuves Validées Incohérentes
 * 
 * Ce script corrige les preuves d'expédition qui sont marquées comme "verified"
 * mais dont le paiement est toujours en "pending_shipping_validation"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInconsistentProofs() {
    console.log('🔧 Correction des Preuves Validées Incohérentes\n');

    try {
        // 1. Identifier les preuves validées avec paiements en attente
        console.log('🔍 1. Identification des preuves incohérentes...');
        
        const inconsistentProofs = await prisma.shippingProof.findMany({
            where: {
                status: 'verified',
                payment: {
                    status: 'pending_shipping_validation'
                }
            },
            include: {
                payment: {
                    include: {
                        product: true
                    }
                }
            }
        });

        console.log(`   Trouvé ${inconsistentProofs.length} preuves incohérentes:\n`);
        
        if (inconsistentProofs.length === 0) {
            console.log('   ✅ Aucune preuve incohérente trouvée !');
            return;
        }

        inconsistentProofs.forEach((proof, index) => {
            console.log(`   ${index + 1}. Preuve ${proof.id}`);
            console.log(`      Statut preuve: ${proof.status}`);
            console.log(`      Paiement: ${proof.payment.id}`);
            console.log(`      Statut paiement: ${proof.payment.status}`);
            console.log(`      Produit: ${proof.payment.product.title}`);
            console.log(`      Validée le: ${proof.verifiedAt?.toISOString()}`);
            console.log('');
        });

        // 2. Corriger chaque preuve incohérente
        console.log('🔧 2. Correction des preuves incohérentes...\n');
        
        for (const proof of inconsistentProofs) {
            await fixInconsistentProof(proof);
        }

        // 3. Vérification finale
        console.log('📊 3. Vérification finale...\n');
        
        const finalCheck = await prisma.shippingProof.findMany({
            where: {
                status: 'verified',
                payment: {
                    status: 'pending_shipping_validation'
                }
            }
        });

        if (finalCheck.length === 0) {
            console.log('   ✅ Toutes les preuves incohérentes ont été corrigées !');
        } else {
            console.log(`   ⚠️  ${finalCheck.length} preuves restent incohérentes`);
        }

        console.log('\n✅ Correction terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function fixInconsistentProof(proof) {
    try {
        console.log(`   🔧 Correction de la preuve ${proof.id}...`);

        // 1. Mettre à jour le statut du paiement
        await prisma.payment.update({
            where: { id: proof.payment.id },
            data: {
                status: 'succeeded',
                updatedAt: new Date()
            }
        });

        console.log(`      ✅ Paiement ${proof.payment.id} mis à jour: succeeded`);

        // 2. Mettre à jour le statut du produit
        await prisma.product.update({
            where: { id: proof.payment.productId },
            data: {
                status: 'sold'
            }
        });

        console.log(`      ✅ Produit ${proof.payment.productId} marqué comme vendu`);

        // 3. Vérifier que la preuve est bien en "verified"
        if (proof.status !== 'verified') {
            await prisma.shippingProof.update({
                where: { id: proof.id },
                data: {
                    status: 'verified',
                    verifiedAt: proof.verifiedAt || new Date(),
                    verifiedBy: proof.verifiedBy || 'admin'
                }
            });
            console.log(`      ✅ Preuve ${proof.id} marquée comme vérifiée`);
        }

        console.log(`      ✅ Preuve ${proof.id} corrigée avec succès\n`);

    } catch (error) {
        console.error(`      ❌ Erreur lors de la correction de la preuve ${proof.id}:`, error);
    }
}

// Exécuter la correction
if (require.main === module) {
    fixInconsistentProofs();
}

module.exports = { fixInconsistentProofs };

